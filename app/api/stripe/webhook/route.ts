import { getStripeClient } from '@/lib/stripe-client';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getPlanByPriceIdAdmin } from '@/lib/plan-utils';
import { syncStyleToSheets } from '@/lib/services/article-styles-sync';
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

          await supabase.from('subscriptions').upsert({
            user_id: profileId,
            stripe_subscription_id: subscriptionId as string,
            stripe_price_id: priceId || '',
            plan,
            status: subscriptionStatus,
            current_period_start: new Date(periodStart * 1000).toISOString(),
            current_period_end: new Date(periodEnd * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          });
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

        // Update subscription record
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId as string)
          .single();

        if (profile && subscription.current_period_start && subscription.current_period_end) {
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
            updated_at: new Date().toISOString(),
          });
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'canceled',
            subscription_plan: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId as string);

        // Update subscription record
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId as string)
          .single();

        if (profile) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id);
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Update subscription status to active on successful payment
        await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId as string);

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Update subscription status to past_due
        await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId as string);

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
