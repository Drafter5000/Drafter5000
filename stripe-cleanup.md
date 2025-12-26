# Run the cleanup script:

STRIPE_SECRET_KEY=sk_test_your_key_here bun run scripts/stripe-cleanup.ts

# if you have the key in your .env.local:

source .env.local && bun run scripts/stripe-cleanup.ts

https://dashboard.stripe.com/acct_1Qe8G7Q2V650apbb/test/workbench/overview
go to review data > Delete all test data.
