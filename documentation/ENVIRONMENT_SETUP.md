# Complete Environment Setup Guide

This guide walks you through setting up all environment variables and services for the Drafter application, from sandbox/testing to production.

---

## Table of Contents

1. [Quick Reference - All Environment Variables](#quick-reference---all-environment-variables)
2. [Supabase Setup](#1-supabase-setup)
3. [Stripe Setup (Sandbox/Test)](#2-stripe-setup-sandboxtest)
4. [Stripe Webhook Configuration](#3-stripe-webhook-configuration)
5. [Google Sheets Setup](#4-google-sheets-setup)
6. [Multi-Tenant & Super Admin Setup](#5-multi-tenant--super-admin-setup)
7. [Local Development](#6-local-development)
8. [Production Deployment](#7-production-deployment)
9. [Testing the Complete Flow](#8-testing-the-complete-flow)

---

## Quick Reference - All Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=

# Stripe API Keys
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=

# Stripe Price IDs
STRIPE_PRICE_PRO_ID=
STRIPE_PRICE_ENTERPRISE_ID=

# Stripe Product IDs (Optional)
STRIPE_PRODUCT_PRO_ID=
STRIPE_PRODUCT_ENTERPRISE_ID=

# App URLs
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_VERCEL_URL=

# Google Sheets
GOOGLE_CREDENTIALS_PATH=
GOOGLE_SHEETS_CUSTOMER_CONFIG_ID=
GOOGLE_SHEETS_ARTICLES_ID=

# Super Admin (Multi-tenant)
SUPER_ADMIN_EMAIL=
```

---

## 1. Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign in with GitHub
3. Click "New Project"
4. Fill in:
   - **Organization**: Select or create one
   - **Project name**: `drafter` (or your preferred name)
   - **Database password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project" and wait for setup (~2 minutes)

### Step 2: Get Your API Keys

1. In your Supabase project, go to **Settings** (gear icon) → **API**
2. Copy these values:

| Setting                     | Environment Variable            |
| --------------------------- | ------------------------------- |
| Project URL                 | `NEXT_PUBLIC_SUPABASE_URL`      |
| `anon` `public` key         | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY`     |

### Step 3: Configure Authentication Redirect

1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for local dev)
   - `https://yourdomain.com/auth/callback` (for production)

```env
# For local development
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

### Step 4: Run Database Migrations

```bash
# Run all migrations
bun run db:migrate

# Or manually in Supabase SQL Editor:
# 1. Go to SQL Editor in Supabase Dashboard
# 2. Run scripts/01-schema.sql
# 3. Run scripts/02-subscription-plans-schema.sql
# 4. Run scripts/03-seed-subscription-plans.sql
```

---

## 2. Stripe Setup (Sandbox/Test)

### Step 1: Create Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up with email or Google
3. Verify your email address

### Step 2: Get Test API Keys

1. In Stripe Dashboard, ensure **Test mode** is ON (toggle in top-right)
2. Go to **Developers** → **API keys**
3. Copy these values:

| Key Type                        | Environment Variable                                              |
| ------------------------------- | ----------------------------------------------------------------- |
| Publishable key (`pk_test_...`) | `STRIPE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Secret key (`sk_test_...`)      | `STRIPE_SECRET_KEY`                                               |

```env
STRIPE_SECRET_KEY=sk_test_51Qe8G7Q2V650apbb...
STRIPE_PUBLISHABLE_KEY=pk_test_51Qe8G7Q2V650apbb...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Qe8G7Q2V650apbb...
```

### Step 3: Create Products and Prices

#### Option A: Using Stripe Dashboard (Recommended for beginners)

1. Go to **Products** → **Add product**

2. **Create Pro Plan:**
   - Name: `Pro`
   - Description: `Most popular for creators`
   - Click "Add product"
   - Add a price:
     - Pricing model: Standard pricing
     - Price: `$70.00`
     - Billing period: Monthly
     - Click "Add price"
   - Copy the **Price ID** (`price_...`) → `STRIPE_PRICE_PRO_ID`
   - Copy the **Product ID** (`prod_...`) → `STRIPE_PRODUCT_PRO_ID`

3. **Create Enterprise Plan:**
   - Name: `Enterprise`
   - Description: `For teams and agencies`
   - Price: `$299.00` / Monthly
   - Copy the **Price ID** → `STRIPE_PRICE_ENTERPRISE_ID`
   - Copy the **Product ID** → `STRIPE_PRODUCT_ENTERPRISE_ID`

#### Option B: Using Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Create Pro product and price
stripe products create --name="Pro" --description="Most popular for creators"
# Note the prod_xxx ID

stripe prices create \
  --product=prod_xxx \
  --unit-amount=7000 \
  --currency=usd \
  --recurring[interval]=month
# Note the price_xxx ID

# Create Enterprise product and price
stripe products create --name="Enterprise" --description="For teams and agencies"
stripe prices create \
  --product=prod_yyy \
  --unit-amount=29900 \
  --currency=usd \
  --recurring[interval]=month
```

### Step 4: Update Database with Stripe IDs

After creating products in Stripe, update your database:

```sql
-- Run in Supabase SQL Editor
UPDATE subscription_plans
SET stripe_product_id = 'prod_YOUR_PRO_PRODUCT_ID',
    stripe_price_id = 'price_YOUR_PRO_PRICE_ID'
WHERE id = 'pro';

UPDATE subscription_plans
SET stripe_product_id = 'prod_YOUR_ENTERPRISE_PRODUCT_ID',
    stripe_price_id = 'price_YOUR_ENTERPRISE_PRICE_ID'
WHERE id = 'enterprise';
```

---

## 3. Stripe Webhook Configuration

### For Local Development

1. **Install Stripe CLI:**

   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows (with scoop)
   scoop install stripe

   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe:**

   ```bash
   stripe login
   ```

3. **Forward webhooks to localhost:**

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook signing secret** (shown in terminal output):

   ```
   Ready! Your webhook signing secret is whsec_xxxxx
   ```

5. **Add to `.env.local`:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### For Production

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. Configure:
   - **Endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
   - **Events to send**: Select these events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.trial_will_end`
3. Click "Add endpoint"
4. Click "Reveal" under Signing secret
5. Copy the `whsec_...` value → `STRIPE_WEBHOOK_SECRET`

---

## 4. Google Sheets Setup

### Step 1: Create Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name: `drafter-sheets` (or your preferred name)
4. Click "Create"

### Step 2: Enable Google Sheets API

1. Go to **APIs & Services** → **Library**
2. Search for "Google Sheets API"
3. Click on it → Click "Enable"

### Step 3: Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "Service Account"
3. Fill in:
   - Service account name: `drafter-sheets-service`
   - Service account ID: auto-generated
4. Click "Create and Continue"
5. Skip the optional steps, click "Done"

### Step 4: Generate JSON Key

1. Click on your newly created service account
2. Go to **Keys** tab
3. Click "Add Key" → "Create new key"
4. Select **JSON** → Click "Create"
5. A JSON file will download - **save this securely!**
6. Move the file to your project (but NOT in git):

   ```bash
   mv ~/Downloads/drafter-sheets-xxxxx.json ./credentials/google-service-account.json
   ```

7. Add to `.gitignore`:

   ```
   credentials/
   *.json
   !package.json
   !tsconfig.json
   !components.json
   ```

8. Set environment variable:
   ```env
   GOOGLE_CREDENTIALS_PATH=./credentials/google-service-account.json
   ```

### Step 5: Create Google Sheets

1. Go to [https://sheets.google.com](https://sheets.google.com)
2. Create a new spreadsheet for **Customer Config**
3. Copy the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```
4. Set: `GOOGLE_SHEETS_CUSTOMER_CONFIG_ID=SPREADSHEET_ID_HERE`

5. Create another spreadsheet for **Articles**
6. Copy its ID → `GOOGLE_SHEETS_ARTICLES_ID=SPREADSHEET_ID_HERE`

### Step 6: Share Sheets with Service Account

1. Open each Google Sheet
2. Click "Share"
3. Add the service account email (found in your JSON file as `client_email`):
   ```
   drafter-sheets-service@your-project.iam.gserviceaccount.com
   ```
4. Give "Editor" access
5. Click "Share"

---

## 5. Multi-Tenant & Super Admin Setup

The application is designed with multi-tenant architecture for future expansion. For MVP, it uses a single drafter organization with one super admin.

### How It Works

1. **Drafter Organization**: Created automatically on first deployment
2. **Super Admin**: First user who signs up with `SUPER_ADMIN_EMAIL` becomes super admin
3. **Regular Users**: All other users join the drafter organization as members

### Step 1: Set Super Admin Email

Add to your environment variables:

```env
# The email address that will become super admin on signup
SUPER_ADMIN_EMAIL=admin@yourdomain.com
```

### Step 2: Run Bootstrap

The bootstrap script runs automatically on `bun install` (via postinstall), or manually:

```bash
bun run db:bootstrap
```

This will:

- Create the drafter organization (if not exists)
- Check super admin configuration
- Verify subscription plans exist

### Step 3: Sign Up as Super Admin

1. Go to `/signup`
2. Sign up with the email set in `SUPER_ADMIN_EMAIL`
3. You'll automatically be granted super admin privileges

### Database Tables Created

| Table                      | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| `organizations`            | Organization/tenant data                   |
| `organization_members`     | User-organization relationships with roles |
| `organization_invitations` | Pending invitations                        |

### User Roles

| Role          | Permissions                                    |
| ------------- | ---------------------------------------------- |
| `super_admin` | Full access to everything, can manage all orgs |
| `admin`       | Can manage organization members and settings   |
| `member`      | Standard user access                           |
| `viewer`      | Read-only access                               |

### Future Expansion

The architecture supports:

- Multiple organizations
- User switching between organizations
- Organization-specific settings and branding
- Role-based access control per organization

---

## 6. Local Development

### Complete `.env.local` for Development

```env
# ===================
# SUPABASE
# ===================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback

# ===================
# STRIPE (TEST MODE)
# ===================
STRIPE_SECRET_KEY=sk_test_51Qe8G7Q2V650apbb...
STRIPE_PUBLISHABLE_KEY=pk_test_51Qe8G7Q2V650apbb...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Qe8G7Q2V650apbb...

# Webhook secret from: stripe listen --forward-to localhost:3000/api/stripe/webhook
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs from Stripe Dashboard (Test mode)
STRIPE_PRICE_PRO_ID=price_...
STRIPE_PRICE_ENTERPRISE_ID=price_...

# Product IDs (optional)
STRIPE_PRODUCT_PRO_ID=prod_...
STRIPE_PRODUCT_ENTERPRISE_ID=prod_...

# ===================
# APP URLS
# ===================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_VERCEL_URL=http://localhost:3000

# ===================
# GOOGLE SHEETS
# ===================
GOOGLE_CREDENTIALS_PATH=./credentials/google-service-account.json
GOOGLE_SHEETS_CUSTOMER_CONFIG_ID=your_spreadsheet_id
GOOGLE_SHEETS_ARTICLES_ID=your_spreadsheet_id

# ===================
# SUPER ADMIN
# ===================
SUPER_ADMIN_EMAIL=admin@yourdomain.com
```

### Start Development

```bash
# Terminal 1: Start the app
bun run dev

# Terminal 2: Forward Stripe webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 7. Production Deployment

### Step 1: Switch Stripe to Live Mode

1. In Stripe Dashboard, toggle OFF "Test mode"
2. Complete account activation (requires business details)
3. Go to **Developers** → **API keys**
4. Copy your **live** keys (`pk_live_...` and `sk_live_...`)

### Step 2: Create Live Products

Repeat the product creation process from Section 2, but in live mode:

- Create Pro and Enterprise products with live prices
- Note the new `price_...` IDs

### Step 3: Configure Production Webhook

1. Go to **Developers** → **Webhooks** (in live mode)
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select the same events as test mode
4. Copy the live webhook secret

### Step 4: Set Production Environment Variables

In your hosting platform (Vercel, etc.):

```env
# SUPABASE (same as dev, or create production project)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# STRIPE (LIVE MODE - no sk_test_ or pk_test_!)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (live webhook secret)

# LIVE Price IDs
STRIPE_PRICE_PRO_ID=price_... (live price)
STRIPE_PRICE_ENTERPRISE_ID=price_... (live price)

# APP URLS
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_VERCEL_URL=https://yourdomain.com

# GOOGLE SHEETS (same credentials work for production)
GOOGLE_CREDENTIALS_PATH=/path/to/credentials.json
GOOGLE_SHEETS_CUSTOMER_CONFIG_ID=your_spreadsheet_id
GOOGLE_SHEETS_ARTICLES_ID=your_spreadsheet_id

# SUPER ADMIN
SUPER_ADMIN_EMAIL=admin@yourdomain.com
```

### Step 5: Update Database with Live Stripe IDs

```sql
UPDATE subscription_plans
SET stripe_product_id = 'prod_LIVE_PRO_ID',
    stripe_price_id = 'price_LIVE_PRO_ID'
WHERE id = 'pro';

UPDATE subscription_plans
SET stripe_product_id = 'prod_LIVE_ENTERPRISE_ID',
    stripe_price_id = 'price_LIVE_ENTERPRISE_ID'
WHERE id = 'enterprise';
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add STRIPE_SECRET_KEY
# ... repeat for all variables
```

Or use Vercel Dashboard → Settings → Environment Variables

---

## 8. Testing the Complete Flow

### Test Stripe Integration (Sandbox)

1. **Test Cards** - Use these in test mode:
   | Scenario | Card Number |
   |----------|-------------|
   | Successful payment | `4242 4242 4242 4242` |
   | Declined | `4000 0000 0000 0002` |
   | Requires authentication | `4000 0025 0000 3155` |
   | Insufficient funds | `4000 0000 0000 9995` |

   Use any future expiry date and any 3-digit CVC.

2. **Test Subscription Flow:**

   ```bash
   # Ensure webhook forwarding is running
   stripe listen --forward-to localhost:3000/api/stripe/webhook

   # In another terminal
   bun run dev
   ```

   - Go to `/pricing`
   - Click "Start Free Trial" on Pro plan
   - Use test card `4242 4242 4242 4242`
   - Verify subscription appears in dashboard

3. **Test Webhook Events:**
   ```bash
   # Trigger a test event
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.updated
   stripe trigger invoice.payment_succeeded
   ```

### Test Google Sheets Integration

1. Verify service account has access to your sheets
2. Test by completing onboarding flow
3. Check if data appears in your Google Sheet

### Checklist Before Going Live

- [ ] All test payments work correctly
- [ ] Webhooks are received and processed
- [ ] User subscriptions update in database
- [ ] Google Sheets receives data
- [ ] Email notifications work (if configured)
- [ ] Stripe account is fully activated
- [ ] Live webhook endpoint is configured
- [ ] Production environment variables are set
- [ ] Database has live Stripe price IDs

---

## Troubleshooting

### Stripe Webhook Errors

**"Invalid signature" error:**

- Ensure `STRIPE_WEBHOOK_SECRET` matches your environment
- For local: use the secret from `stripe listen` output
- For production: use the secret from Stripe Dashboard

**Webhooks not received:**

- Check webhook endpoint URL is correct
- Verify events are selected in Stripe Dashboard
- Check server logs for errors

### Google Sheets Errors

**"Permission denied" error:**

- Ensure service account email is added as Editor to the sheet
- Verify `GOOGLE_CREDENTIALS_PATH` points to correct file

**"API not enabled" error:**

- Enable Google Sheets API in Google Cloud Console

### Supabase Errors

**"Invalid API key" error:**

- Verify keys match your Supabase project
- Check for extra spaces or newlines in env values

---

## Quick Links

| Service      | Dashboard                                                    | Documentation                                                            |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Supabase     | [dashboard.supabase.com](https://dashboard.supabase.com)     | [supabase.com/docs](https://supabase.com/docs)                           |
| Stripe       | [dashboard.stripe.com](https://dashboard.stripe.com)         | [stripe.com/docs](https://stripe.com/docs)                               |
| Google Cloud | [console.cloud.google.com](https://console.cloud.google.com) | [developers.google.com/sheets](https://developers.google.com/sheets/api) |
| Vercel       | [vercel.com/dashboard](https://vercel.com/dashboard)         | [vercel.com/docs](https://vercel.com/docs)                               |
