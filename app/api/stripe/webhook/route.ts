import { getStripeClient } from '@/lib/stripe-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getPlanByPriceIdAdmin } from '@/lib/plan-utils';
import { syncStyleToSheets } from '@/lib/services/article-styles-sync';
import { setUsageLimit, resetUsage } from '@/lib/usage-limits';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

const stripe = getStripeClient();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Maps a Stripe price ID to a plan ID using database lookup.
 * Falls back to 'free' if no matching plan is found.
 */
async function mapPriceIdToPlan(priceId: string | undefined): Promise<string> {
  if (!priceId) return 'free';

  const plan = await getPlanByPriceIdAdmin(priceId);
  return plan?.id ?? 'free';
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Use admin client for webhook operations since there's no authenticated user context
  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const userId = session.metadata?.user_id;
        const planIdFromMetadata = session.metadata?.plan_id;
        const hasPendingStyle = session.metadata?.pending_style === 'true';

        if (!subscriptionId) break;

        // Retrieve the full subscription object from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);

        // Determine plan from price using database lookup
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const plan = planIdFromMetadata || (await mapPriceIdToPlan(priceId));

        // Determine subscription status - for trials, status will be 'trialing'
        const subscriptionStatus = subscription.status || 'active';

        // Update user profile - try by user_id first (from metadata), then by stripe_customer_id
        if (userId) {
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              subscription_status: subscriptionStatus,
              subscription_plan: plan,
              stripe_customer_id: customerId as string,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (updateError) {
            console.error('Failed to update profile by user_id:', updateError);
          }
        } else {
          // Fallback to customer_id lookup
          await supabase
            .from('user_profiles')
            .update({
              subscription_status: subscriptionStatus,
              subscription_plan: plan,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId as string);
        }

        // Get profile for subscription record
        let profileId = userId;
        if (!profileId) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('stripe_customer_id', customerId as string)
            .single();
          profileId = profile?.id;
        }

        if (profileId) {
          const periodStart = subscription.current_period_start || Math.floor(Date.now() / 1000);
          const periodEnd =
            subscription.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

          // Get articles limit from plan
          const planData = await getPlanByPriceIdAdmin(priceId || '');
          const articlesLimit = planData?.articles_per_month ?? 2;

          await supabase.from('subscriptions').upsert({
            user_id: profileId,
            stripe_subscription_id: subscriptionId as string,
            stripe_price_id: priceId || '',
            plan,
            status: subscriptionStatus,
            current_period_start: new Date(periodStart * 1000).toISOString(),
            current_period_end: new Date(periodEnd * 1000).toISOString(),
            articles_used: 0,
            articles_limit: articlesLimit,
            usage_reset_at: new Date(periodStart * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Record initial payment from checkout session
          const amountTotal = session.amount_total || 0;
          const currency = session.currency || 'usd';
          const paymentIntentId = session.payment_intent;

          if (amountTotal > 0 && paymentIntentId) {
            try {
              // Get payment method details from payment intent
              let paymentMethodType = null;
              let paymentMethodLast4 = null;
              let paymentMethodBrand = null;

              try {
                const paymentIntent = await stripe.paymentIntents.retrieve(
                  paymentIntentId as string
                );
                if (paymentIntent.payment_method) {
                  const paymentMethod = await stripe.paymentMethods.retrieve(
                    paymentIntent.payment_method as string
                  );
                  if (paymentMethod.card) {
                    paymentMethodType = 'card';
                    paymentMethodLast4 = paymentMethod.card.last4;
                    paymentMethodBrand = paymentMethod.card.brand;
                  } else {
                    paymentMethodType = paymentMethod.type;
                  }
                }
              } catch (pmErr) {
                console.error('Failed to retrieve payment method details:', pmErr);
              }

              await supabase.from('payments').upsert(
                {
                  user_id: profileId,
                  stripe_payment_intent_id: paymentIntentId as string,
                  stripe_subscription_id: subscriptionId as string,
                  amount_cents: amountTotal,
                  currency: currency,
                  status: 'succeeded',
                  payment_method_type: paymentMethodType,
                  payment_method_last4: paymentMethodLast4,
                  payment_method_brand: paymentMethodBrand,
                  description: `Initial subscription payment for ${plan} plan`,
                  paid_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'stripe_payment_intent_id' }
              );
              console.log(
                `Initial payment recorded: user=${profileId}, amount=${amountTotal} ${currency}`
              );
            } catch (paymentErr) {
              console.error('Failed to record initial payment:', paymentErr);
            }
          }
        }

        // Handle pending style data from onboarding signup flow
        // Requirements: 7.1, 7.2, 7.3
        // Style data is stored in pending_style_data table (not Stripe metadata due to 500 char limit)
        if (hasPendingStyle && profileId) {
          try {
            // Fetch pending style data from database
            const { data: pendingData, error: pendingError } = await supabase
              .from('pending_style_data')
              .select('*')
              .eq('user_id', profileId)
              .single();

            if (pendingError || !pendingData) {
              // Log error but don't fail webhook - payment is already recorded
              // Requirements: 8.4, 8.5
              console.error('Failed to fetch pending style data:', pendingError);
              console.error(
                `MANUAL_RECOVERY_NEEDED: User ${profileId} paid but pending style data not found`
              );
              // Don't break - continue processing other webhook logic
            } else {
              const styleSamples = pendingData.style_samples || [];
              const subjects = pendingData.subjects || [];
              const deliveryDays = pendingData.delivery_days || [];
              const preferredLanguage = pendingData.preferred_language || 'en';
              const displayName = pendingData.display_name || '';
              const job = pendingData.job || '';

              // Get user email from profile
              const { data: userProfile } = await supabase
                .from('user_profiles')
                .select('email')
                .eq('id', profileId)
                .single();

              // Check if article_style already exists for this user (prevent duplicates)
              const { data: existingStyle } = await supabase
                .from('article_styles')
                .select('*')
                .eq('user_id', profileId)
                .single();

              let articleStyle = existingStyle as any;
              let styleError: any = null;

              if (!existingStyle) {
                // Create article_style record only if it doesn't exist
                // Requirements: 7.1
                const { data: newStyle, error: createError } = await supabase
                  .from('article_styles')
                  .insert({
                    user_id: profileId,
                    name: `${displayName}'s Style`,
                    style_samples: styleSamples,
                    subjects: subjects,
                    email: userProfile?.email || '',
                    display_name: displayName,
                    preferred_language: preferredLanguage,
                    delivery_days: deliveryDays,
                    is_active: true,
                    sheets_synced: false, // Will be set to true after sync
                  })
                  .select()
                  .single();

                articleStyle = newStyle;
                styleError = createError;
              } else {
                console.log(
                  `Article style already exists for user ${profileId}, skipping creation`
                );
              }

              // Mark onboarding as completed
              await supabase
                .from('user_profiles')
                .update({ onboarding_completed: true })
                .eq('id', profileId);

              if (styleError) {
                // Log error but don't fail webhook - payment is already recorded
                // Requirements: 8.5
                console.error('Failed to create article style:', styleError);
                console.error(
                  `MANUAL_RECOVERY_NEEDED: User ${profileId} paid but article style creation failed`
                );
              } else if (articleStyle && !articleStyle.sheets_synced) {
                // Sync to Google Sheets with job field ONLY if not already synced
                // Requirements: 7.2
                try {
                  const syncResult = await syncStyleToSheets(articleStyle, job);
                  if (!syncResult.success) {
                    // Log error but don't fail - Google Sheets sync is non-critical
                    // Requirements: 8.4
                    console.error('Failed to sync style to Google Sheets:', syncResult.error);
                    console.error(`GOOGLE_SHEETS_RETRY_NEEDED: User ${profileId} style not synced`);
                  } else {
                    // Mark as synced to prevent duplicate syncs
                    await supabase
                      .from('article_styles')
                      .update({ sheets_synced: true, updated_at: new Date().toISOString() })
                      .eq('id', articleStyle.id);
                    console.log(`Style synced to Google Sheets for user ${profileId}`);
                  }
                } catch (syncError) {
                  // Google Sheets sync failure should not block user flow
                  // Requirements: 8.4
                  console.error('Google Sheets sync error:', syncError);
                  console.error(`GOOGLE_SHEETS_RETRY_NEEDED: User ${profileId} style not synced`);
                }

                // Clean up pending style data after successful article style creation
                // Requirements: 7.3
                await supabase.from('pending_style_data').delete().eq('user_id', profileId);
              } else if (articleStyle?.sheets_synced) {
                console.log(
                  `Style already synced to Google Sheets for user ${profileId}, skipping`
                );
                // Still clean up pending data
                await supabase.from('pending_style_data').delete().eq('user_id', profileId);
              }
            }
          } catch (styleProcessError) {
            // Log error but don't fail webhook - payment is already recorded
            // Requirements: 8.5
            console.error('Error processing pending style data:', styleProcessError);
            console.error(
              `MANUAL_RECOVERY_NEEDED: User ${profileId} paid but style processing failed`
            );
          }
        }

        console.log(
          `Checkout completed: user=${userId}, status=${subscriptionStatus}, plan=${plan}, hasPendingStyle=${hasPendingStyle}`
        );
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        const isCreated = event.type === 'customer.subscription.created';

        // Determine plan from price using database lookup
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const plan = await mapPriceIdToPlan(priceId);

        await supabase
          .from('user_profiles')
          .update({
            subscription_status: subscription.status,
            subscription_plan: plan,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId as string);

        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId as string)
          .single();

        if (profile && subscription.current_period_start && subscription.current_period_end) {
          // Get current subscription to check for plan changes
          const { data: currentSub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', profile.id)
            .single();

          // Check if this is a plan change (upgrade/downgrade)
          const isPlanChange = currentSub && currentSub.plan !== plan && !isCreated;

          // Get articles limit from plan
          const planData = await getPlanByPriceIdAdmin(priceId || '');
          const articlesLimit = planData?.articles_per_month ?? 2;

          // Save history for plan changes
          if (isPlanChange && currentSub) {
            const eventType = plan > currentSub.plan ? 'upgraded' : 'downgraded';
            await supabase.from('subscription_history').insert({
              user_id: profile.id,
              stripe_subscription_id: subscription.id,
              stripe_price_id: currentSub.stripe_price_id,
              plan: currentSub.plan,
              status: currentSub.status,
              period_start: currentSub.current_period_start,
              period_end: currentSub.current_period_end,
              event_type: eventType,
            });
            console.log(
              `Subscription ${eventType}: user=${profile.id}, from=${currentSub.plan} to=${plan}`
            );

            // Update usage limit when plan changes
            await setUsageLimit(profile.id, articlesLimit);
          }

          // Save history for new subscriptions
          if (isCreated) {
            await supabase.from('subscription_history').insert({
              user_id: profile.id,
              stripe_subscription_id: subscription.id,
              stripe_price_id: priceId || '',
              plan,
              status: subscription.status,
              period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              event_type: 'created',
            });
            console.log(`Subscription created: user=${profile.id}, plan=${plan}`);
          }

          // Update subscription record with usage tracking fields
          await supabase.from('subscriptions').upsert({
            user_id: profile.id,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId || '',
            plan,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at: subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null,
            canceled_at: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : null,
            articles_limit: articlesLimit,
            // Only reset usage for new subscriptions, not updates
            ...(isCreated
              ? {
                  articles_used: 0,
                  usage_reset_at: new Date(subscription.current_period_start * 1000).toISOString(),
                }
              : {}),
            updated_at: new Date().toISOString(),
          });
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId as string)
          .single();

        if (profile) {
          // Get current subscription to save to history
          const { data: currentSub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', profile.id)
            .single();

          // Save to history before updating
          if (currentSub) {
            await supabase.from('subscription_history').insert({
              user_id: profile.id,
              stripe_subscription_id: subscription.id,
              stripe_price_id: currentSub.stripe_price_id,
              plan: currentSub.plan,
              status: 'canceled',
              period_start: currentSub.current_period_start,
              period_end: currentSub.current_period_end,
              event_type: 'canceled',
            });
            console.log(
              `Subscription canceled and saved to history: user=${profile.id}, plan=${currentSub.plan}`
            );
          }

          // Update subscription record
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id);
        }

        // Update user profile
        await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'canceled',
            subscription_plan: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId as string);

        break;
      }

      case 'invoice.payment_succeeded': {
        // Requirements: 5.3 - Update subscription status to active on successful payment (renewal)
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        const invoiceId = invoice.id;
        const amountPaid = invoice.amount_paid;
        const currency = invoice.currency;
        const chargeId = invoice.charge;
        const paymentIntentId = invoice.payment_intent;

        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, subscription_plan')
          .eq('stripe_customer_id', customerId as string)
          .single();

        if (!profile) {
          console.error(`No profile found for customer ${customerId}`);
          break;
        }

        // Record payment in payments table
        try {
          // Get payment method details from charge if available
          let paymentMethodType = null;
          let paymentMethodLast4 = null;
          let paymentMethodBrand = null;

          if (chargeId) {
            try {
              const charge = await stripe.charges.retrieve(chargeId as string);
              if (charge.payment_method_details?.card) {
                paymentMethodType = 'card';
                paymentMethodLast4 = charge.payment_method_details.card.last4;
                paymentMethodBrand = charge.payment_method_details.card.brand;
              } else if (charge.payment_method_details?.type) {
                paymentMethodType = charge.payment_method_details.type;
              }
            } catch (chargeErr) {
              console.error('Failed to retrieve charge details:', chargeErr);
            }
          }

          await supabase.from('payments').upsert(
            {
              user_id: profile.id,
              stripe_payment_intent_id: paymentIntentId as string,
              stripe_invoice_id: invoiceId as string,
              stripe_charge_id: chargeId as string,
              stripe_subscription_id: subscriptionId as string,
              amount_cents: amountPaid,
              currency: currency,
              status: 'succeeded',
              payment_method_type: paymentMethodType,
              payment_method_last4: paymentMethodLast4,
              payment_method_brand: paymentMethodBrand,
              description:
                invoice.description || `Payment for ${invoice.billing_reason || 'subscription'}`,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'stripe_payment_intent_id' }
          );
          console.log(`Payment recorded: user=${profile.id}, amount=${amountPaid} ${currency}`);
        } catch (paymentErr) {
          console.error('Failed to record payment:', paymentErr);
        }

        // Update subscription status to active on successful payment
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId as string);

        if (updateError) {
          console.error('Failed to update subscription status on payment success:', updateError);
        }

        // If this is a subscription invoice (renewal), update subscription period and save history
        if (subscriptionId) {
          try {
            // Retrieve the updated subscription from Stripe to get new period dates
            const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
            const priceId = subscription.items?.data?.[0]?.price?.id;
            const plan = await mapPriceIdToPlan(priceId);

            const periodStart = subscription.current_period_start;
            const periodEnd = subscription.current_period_end;

            // Get current subscription record to check if this is a renewal
            const { data: currentSub } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', profile.id)
              .single();

            // Determine if this is a renewal (existing subscription with different period)
            const isRenewal =
              currentSub &&
              currentSub.current_period_start &&
              new Date(currentSub.current_period_start).getTime() !==
                new Date(periodStart * 1000).getTime();

            // Get articles limit from plan
            const planData = await getPlanByPriceIdAdmin(priceId || '');
            const articlesLimit = planData?.articles_per_month ?? 2;

            // Save to subscription history before updating (preserve old period)
            if (currentSub && isRenewal) {
              await supabase.from('subscription_history').insert({
                user_id: profile.id,
                stripe_subscription_id: subscriptionId as string,
                stripe_price_id: currentSub.stripe_price_id,
                plan: currentSub.plan,
                status: 'renewed',
                period_start: currentSub.current_period_start,
                period_end: currentSub.current_period_end,
                amount_paid_cents: amountPaid,
                currency: currency,
                invoice_id: invoiceId,
                event_type: 'renewed',
              });
              console.log(
                `Subscription history saved for renewal: user=${profile.id}, period=${currentSub.current_period_start} to ${currentSub.current_period_end}`
              );

              // Reset usage on renewal (new billing period)
              await resetUsage(profile.id);
              console.log(`Usage reset for user ${profile.id} on subscription renewal`);
            }

            // Update subscription record with new period dates and reset usage for renewals
            await supabase.from('subscriptions').upsert({
              user_id: profile.id,
              stripe_subscription_id: subscriptionId as string,
              stripe_price_id: priceId || '',
              plan,
              status: 'active',
              current_period_start: new Date(periodStart * 1000).toISOString(),
              current_period_end: new Date(periodEnd * 1000).toISOString(),
              cancel_at: null,
              canceled_at: null,
              articles_limit: articlesLimit,
              // Reset usage on renewal
              ...(isRenewal
                ? { articles_used: 0, usage_reset_at: new Date(periodStart * 1000).toISOString() }
                : {}),
              updated_at: new Date().toISOString(),
            });

            console.log(
              `Subscription ${isRenewal ? 'renewed' : 'payment succeeded'}: customer=${customerId}, user=${profile.id}, period=${new Date(periodStart * 1000).toISOString()} to ${new Date(periodEnd * 1000).toISOString()}`
            );
          } catch (subError) {
            console.error('Failed to update subscription on payment success:', subError);
          }
        } else {
          console.log(`Payment succeeded (non-subscription): customer=${customerId}`);
        }

        break;
      }

      case 'invoice.payment_failed': {
        // Requirements: 5.1 - Update subscription status to past_due on payment failure
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        const invoiceId = invoice.id;
        const amountDue = invoice.amount_due;
        const currency = invoice.currency;
        const paymentIntentId = invoice.payment_intent;

        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId as string)
          .single();

        // Record failed payment in payments table
        if (profile) {
          try {
            // Get failure reason from payment intent if available
            let failureReason = null;
            if (paymentIntentId) {
              try {
                const paymentIntent = await stripe.paymentIntents.retrieve(
                  paymentIntentId as string
                );
                failureReason =
                  paymentIntent.last_payment_error?.message ||
                  paymentIntent.last_payment_error?.code;
              } catch (piErr) {
                console.error('Failed to retrieve payment intent:', piErr);
              }
            }

            await supabase.from('payments').upsert(
              {
                user_id: profile.id,
                stripe_payment_intent_id: paymentIntentId as string,
                stripe_invoice_id: invoiceId as string,
                stripe_subscription_id: subscriptionId as string,
                amount_cents: amountDue,
                currency: currency,
                status: 'failed',
                description:
                  invoice.description ||
                  `Failed payment for ${invoice.billing_reason || 'subscription'}`,
                failure_reason: failureReason,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'stripe_payment_intent_id' }
            );
            console.log(
              `Failed payment recorded: user=${profile.id}, amount=${amountDue} ${currency}, reason=${failureReason}`
            );
          } catch (paymentErr) {
            console.error('Failed to record failed payment:', paymentErr);
          }
        }

        // Update subscription status to past_due
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId as string);

        if (updateError) {
          console.error('Failed to update subscription status on payment failure:', updateError);
        }

        // Update subscription record status
        if (profile && subscriptionId) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id);

          console.log(
            `Subscription payment failed: customer=${customerId}, user=${profile.id}, status=past_due`
          );
        } else {
          console.log(`Subscription payment failed: customer=${customerId}, status=past_due`);
        }

        break;
      }

      // Trial events are not handled - trials are disabled
    }
  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
