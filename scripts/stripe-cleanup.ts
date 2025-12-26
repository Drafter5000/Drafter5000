/**
 * Stripe Sandbox Complete Cleanup Script
 *
 * This script removes ALL data from your Stripe test/sandbox account:
 * - Subscriptions (cancelled)
 * - Payment Intents (cancelled if possible)
 * - Invoices (voided)
 * - Customers (deleted)
 * - Products & Prices (archived - cannot be deleted if used)
 * - Coupons (deleted)
 * - Promotion Codes (deactivated)
 * - Webhook Endpoints (deleted)
 * - Connected Accounts (deleted if platform)
 *
 * Usage: STRIPE_SECRET_KEY=sk_test_xxx bun run scripts/stripe-cleanup.ts
 *
 * IMPORTANT: This script only works with test mode API keys (sk_test_*)
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  console.error('   Run with: STRIPE_SECRET_KEY=sk_test_xxx bun run scripts/stripe-cleanup.ts');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  console.error('❌ This script only works with TEST mode API keys (sk_test_*)');
  console.error('   DO NOT use live mode keys to prevent accidental data loss!');
  process.exit(1);
}

// Dynamic import for Stripe
async function main(): Promise<void> {
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(STRIPE_SECRET_KEY as string);

  const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  // ============================================
  // CANCEL ALL SUBSCRIPTIONS
  // ============================================
  async function cancelAllSubscriptions(): Promise<number> {
    console.log('\n🔄 Cancelling all subscriptions...');
    let count = 0;
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const subscriptions = await stripe.subscriptions.list({
        limit: 100,
        starting_after: startingAfter,
        status: 'all',
      });

      for (const subscription of subscriptions.data) {
        if (subscription.status !== 'canceled') {
          try {
            await stripe.subscriptions.cancel(subscription.id);
            console.log(`   ✓ Cancelled: ${subscription.id}`);
            count++;
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            console.log(`   ⚠ Could not cancel ${subscription.id}: ${msg}`);
          }
          await sleep(100);
        }
      }

      hasMore = subscriptions.has_more;
      if (subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      }
    }

    console.log(`   ✅ Cancelled ${count} subscriptions`);
    return count;
  }

  // ============================================
  // VOID/DELETE ALL INVOICES
  // ============================================
  async function voidAllInvoices(): Promise<number> {
    console.log('\n🔄 Processing all invoices...');
    let count = 0;
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const invoices = await stripe.invoices.list({
        limit: 100,
        starting_after: startingAfter,
      });

      for (const invoice of invoices.data) {
        try {
          if (invoice.status === 'draft') {
            // Draft invoices can be deleted
            await stripe.invoices.del(invoice.id);
            console.log(`   ✓ Deleted draft: ${invoice.id}`);
            count++;
          } else if (invoice.status === 'open') {
            // Open invoices must be voided first
            await stripe.invoices.voidInvoice(invoice.id);
            console.log(`   ✓ Voided open: ${invoice.id}`);
            count++;
          } else if (invoice.status === 'uncollectible') {
            // Already uncollectible - nothing more to do
            console.log(`   - Already uncollectible: ${invoice.id}`);
          } else if (invoice.status === 'paid') {
            // Paid invoices cannot be deleted, only voided if not yet finalized
            // Mark as uncollectible if possible (for refunded payments)
            try {
              await stripe.invoices.markUncollectible(invoice.id);
              console.log(`   ✓ Marked uncollectible: ${invoice.id}`);
              count++;
            } catch {
              console.log(`   - Paid invoice (cannot modify): ${invoice.id}`);
            }
          } else if (invoice.status === 'void') {
            console.log(`   - Already voided: ${invoice.id}`);
          } else {
            console.log(`   - Status "${invoice.status}": ${invoice.id}`);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          console.log(`   ⚠ Could not process ${invoice.id}: ${msg}`);
        }
        await sleep(100);
      }

      hasMore = invoices.has_more;
      if (invoices.data.length > 0) {
        startingAfter = invoices.data[invoices.data.length - 1].id;
      }
    }

    console.log(`   ✅ Processed ${count} invoices`);
    return count;
  }

  // ============================================
  // CANCEL ALL PAYMENT INTENTS
  // ============================================
  async function cancelAllPaymentIntents(): Promise<number> {
    console.log('\n🔄 Cancelling payment intents...');
    let count = 0;
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 100,
        starting_after: startingAfter,
      });

      for (const pi of paymentIntents.data) {
        // Can only cancel if not already succeeded/canceled
        if (!['succeeded', 'canceled'].includes(pi.status)) {
          try {
            await stripe.paymentIntents.cancel(pi.id);
            console.log(`   ✓ Cancelled: ${pi.id}`);
            count++;
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            console.log(`   ⚠ Could not cancel ${pi.id}: ${msg}`);
          }
          await sleep(100);
        }
      }

      hasMore = paymentIntents.has_more;
      if (paymentIntents.data.length > 0) {
        startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
      }
    }

    console.log(`   ✅ Cancelled ${count} payment intents`);
    return count;
  }

  // ============================================
  // DELETE ALL CUSTOMERS
  // ============================================
  async function deleteAllCustomers(): Promise<number> {
    console.log('\n🔄 Deleting all customers...');
    let count = 0;
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const customers = await stripe.customers.list({
        limit: 100,
        starting_after: startingAfter,
      });

      for (const customer of customers.data) {
        try {
          await stripe.customers.del(customer.id);
          console.log(`   ✓ Deleted: ${customer.id} (${customer.email || 'no email'})`);
          count++;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          console.log(`   ⚠ Could not delete ${customer.id}: ${msg}`);
        }
        await sleep(100);
      }

      hasMore = customers.has_more;
      if (customers.data.length > 0) {
        startingAfter = customers.data[customers.data.length - 1].id;
      }
    }

    console.log(`   ✅ Deleted ${count} customers`);
    return count;
  }

  // ============================================
  // ARCHIVE ALL PRICES (cannot delete used prices)
  // ============================================
  async function archiveAllPrices(): Promise<number> {
    console.log('\n🔄 Archiving all prices...');
    let count = 0;
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const prices = await stripe.prices.list({
        limit: 100,
        starting_after: startingAfter,
        active: true,
      });

      for (const price of prices.data) {
        try {
          await stripe.prices.update(price.id, { active: false });
          console.log(`   ✓ Archived: ${price.id}`);
          count++;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          console.log(`   ⚠ Could not archive ${price.id}: ${msg}`);
        }
        await sleep(50);
      }

      hasMore = prices.has_more;
      if (prices.data.length > 0) {
        startingAfter = prices.data[prices.data.length - 1].id;
      }
    }

    console.log(`   ✅ Archived ${count} prices`);
    return count;
  }

  // ============================================
  // ARCHIVE ALL PRODUCTS (cannot delete used products)
  // ============================================
  async function archiveAllProducts(): Promise<number> {
    console.log('\n🔄 Archiving all products...');
    let count = 0;
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const products = await stripe.products.list({
        limit: 100,
        starting_after: startingAfter,
        active: true,
      });

      for (const product of products.data) {
        try {
          await stripe.products.update(product.id, { active: false });
          console.log(`   ✓ Archived: ${product.id} (${product.name})`);
          count++;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          console.log(`   ⚠ Could not archive ${product.id}: ${msg}`);
        }
        await sleep(100);
      }

      hasMore = products.has_more;
      if (products.data.length > 0) {
        startingAfter = products.data[products.data.length - 1].id;
      }
    }

    console.log(`   ✅ Archived ${count} products`);
    return count;
  }

  // ============================================
  // DELETE ALL COUPONS
  // ============================================
  async function deleteAllCoupons(): Promise<number> {
    console.log('\n🔄 Deleting all coupons...');
    let count = 0;
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const coupons = await stripe.coupons.list({
        limit: 100,
        starting_after: startingAfter,
      });

      for (const coupon of coupons.data) {
        try {
          await stripe.coupons.del(coupon.id);
          console.log(`   ✓ Deleted: ${coupon.id}`);
          count++;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          console.log(`   ⚠ Could not delete ${coupon.id}: ${msg}`);
        }
        await sleep(100);
      }

      hasMore = coupons.has_more;
      if (coupons.data.length > 0) {
        startingAfter = coupons.data[coupons.data.length - 1].id;
      }
    }

    console.log(`   ✅ Deleted ${count} coupons`);
    return count;
  }

  // ============================================
  // DELETE ALL WEBHOOK ENDPOINTS
  // ============================================
  async function deleteAllWebhooks(): Promise<number> {
    console.log('\n🔄 Deleting all webhook endpoints...');
    let count = 0;

    try {
      const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });

      for (const webhook of webhooks.data) {
        try {
          await stripe.webhookEndpoints.del(webhook.id);
          console.log(`   ✓ Deleted: ${webhook.id} (${webhook.url})`);
          count++;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          console.log(`   ⚠ Could not delete ${webhook.id}: ${msg}`);
        }
        await sleep(100);
      }
    } catch (error) {
      console.log('   ⚠ Could not list webhooks (may not have permission)');
    }

    console.log(`   ✅ Deleted ${count} webhooks`);
    return count;
  }

  // ============================================
  // DELETE CONNECTED ACCOUNTS (for platforms)
  // ============================================
  async function deleteConnectedAccounts(): Promise<number> {
    console.log('\n🔄 Deleting connected accounts...');
    let count = 0;
    let hasMore = true;
    let startingAfter: string | undefined;

    try {
      while (hasMore) {
        const accounts = await stripe.accounts.list({
          limit: 100,
          starting_after: startingAfter,
        });

        for (const account of accounts.data) {
          try {
            await stripe.accounts.del(account.id);
            console.log(`   ✓ Deleted: ${account.id}`);
            count++;
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            console.log(`   ⚠ Could not delete ${account.id}: ${msg}`);
          }
          await sleep(100);
        }

        hasMore = accounts.has_more;
        if (accounts.data.length > 0) {
          startingAfter = accounts.data[accounts.data.length - 1].id;
        }
      }
    } catch (error) {
      console.log('   ⚠ Could not list connected accounts (may not be a platform account)');
    }

    console.log(`   ✅ Deleted ${count} connected accounts`);
    return count;
  }

  // ============================================
  // DEACTIVATE PROMOTION CODES
  // ============================================
  async function deactivatePromotionCodes(): Promise<number> {
    console.log('\n🔄 Deactivating promotion codes...');
    let count = 0;
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const promoCodes = await stripe.promotionCodes.list({
        limit: 100,
        starting_after: startingAfter,
        active: true,
      });

      for (const code of promoCodes.data) {
        try {
          await stripe.promotionCodes.update(code.id, { active: false });
          console.log(`   ✓ Deactivated: ${code.code}`);
          count++;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          console.log(`   ⚠ Could not deactivate ${code.code}: ${msg}`);
        }
        await sleep(100);
      }

      hasMore = promoCodes.has_more;
      if (promoCodes.data.length > 0) {
        startingAfter = promoCodes.data[promoCodes.data.length - 1].id;
      }
    }

    console.log(`   ✅ Deactivated ${count} promotion codes`);
    return count;
  }

  // ============================================
  // MAIN EXECUTION
  // ============================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('        STRIPE SANDBOX COMPLETE CLEANUP SCRIPT');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n⚠️  This will clean ALL data in your Stripe test account!');
  console.log('\n📋 What will be cleaned:');
  console.log('   • Subscriptions → Cancelled');
  console.log('   • Payment Intents → Cancelled (if pending)');
  console.log('   • Invoices → Voided/Deleted');
  console.log('   • Customers → Deleted');
  console.log('   • Products → Archived (cannot delete used products)');
  console.log('   • Prices → Archived (cannot delete used prices)');
  console.log('   • Coupons → Deleted');
  console.log('   • Promotion Codes → Deactivated');
  console.log('   • Webhooks → Deleted');
  console.log('   • Connected Accounts → Deleted');

  try {
    const account = await stripe.accounts.retrieve();
    console.log(`\n📋 Account: ${account.settings?.dashboard?.display_name || account.id}`);
    console.log('   Mode: TEST');
  } catch (error) {
    console.error('❌ Could not verify Stripe account. Check your API key.');
    process.exit(1);
  }

  console.log('\n⏳ Starting cleanup in 3 seconds... (Ctrl+C to cancel)\n');
  await sleep(3000);

  const startTime = Date.now();

  // Execute in proper order (dependencies first)
  const results = {
    subscriptions: await cancelAllSubscriptions(),
    paymentIntents: await cancelAllPaymentIntents(),
    invoices: await voidAllInvoices(),
    customers: await deleteAllCustomers(),
    prices: await archiveAllPrices(),
    products: await archiveAllProducts(),
    coupons: await deleteAllCoupons(),
    promoCodes: await deactivatePromotionCodes(),
    webhooks: await deleteAllWebhooks(),
    connectedAccounts: await deleteConnectedAccounts(),
  };

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    CLEANUP COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📊 Summary:');
  console.log(`   • Subscriptions cancelled: ${results.subscriptions}`);
  console.log(`   • Payment intents cancelled: ${results.paymentIntents}`);
  console.log(`   • Invoices processed: ${results.invoices}`);
  console.log(`   • Customers deleted: ${results.customers}`);
  console.log(`   • Prices archived: ${results.prices}`);
  console.log(`   • Products archived: ${results.products}`);
  console.log(`   • Coupons deleted: ${results.coupons}`);
  console.log(`   • Promotion codes deactivated: ${results.promoCodes}`);
  console.log(`   • Webhooks deleted: ${results.webhooks}`);
  console.log(`   • Connected accounts deleted: ${results.connectedAccounts}`);
  console.log(`\n⏱️  Completed in ${duration} seconds`);
  console.log('\n✅ Your Stripe test account has been cleaned!');
  console.log('\n💡 Note: Products and prices that were used in transactions');
  console.log('   cannot be deleted, only archived (hidden from catalog).');
}

main().catch(error => {
  console.error('\n❌ Script failed:', error.message);
  process.exit(1);
});
