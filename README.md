# ArticleForge Pro - Production MVP

A full-stack SaaS platform for AI-powered article generation with personalized writing styles.

## Architecture Overview

- **Frontend**: Next.js 16 with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Node.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Content Delivery**: Google Sheets API integration
- **Deployment**: Vercel

## Project Structure

\`\`\`
articleforge-pro/
├── app/                          # Next.js app directory
│   ├── api/                      # Backend API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── onboarding/          # Onboarding flow endpoints
│   │   ├── dashboard/           # Dashboard metrics
│   │   └── stripe/              # Stripe webhook handlers
│   ├── onboarding/              # 3-step onboarding flow
│   ├── dashboard/               # Customer dashboard
│   ├── login/                   # Authentication pages
│   ├── signup/
│   ├── pricing/                 # Pricing page
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── auth-provider.tsx        # Auth context
│   ├── protected-route.tsx      # Route protection
│   ├── dashboard-header.tsx     # Dashboard header
│   ├── metric-card.tsx          # Metric card component
│   └── header.tsx               # Site header
├── lib/                         # Utility functions
│   ├── types.ts                 # TypeScript types
│   ├── supabase-client.ts      # Server Supabase client
│   ├── supabase-browser.ts     # Browser Supabase client
│   ├── stripe-client.ts        # Stripe configuration
│   ├── google-sheets.ts        # Google Sheets API
│   ├── auth-utils.ts           # Auth utilities
│   ├── api-client.ts           # API client class
│   └── utils.ts                # General utilities
├── hooks/                       # React hooks
│   └── use-auth.ts             # Custom auth hook
├── public/                      # Static assets
├── .env.example                 # Environment variables template
├── next.config.mjs              # Next.js configuration
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
└── README.md                    # This file
\`\`\`

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account
- Google Cloud project with Sheets API enabled

### Installation

\`\`\`bash
# Clone repository
git clone <repo-url>
cd articleforge-pro

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Update .env.local with your credentials
# (See Environment Setup section below)

# Run development server
npm run dev
\`\`\`

Open http://localhost:3000 in your browser.

## Environment Setup

### Required Environment Variables

Create a `.env.local` file with the following:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_ID=price_...
STRIPE_PRICE_ENTERPRISE_ID=price_...
STRIPE_PRODUCT_PRO_ID=prod_...
STRIPE_PRODUCT_ENTERPRISE_ID=prod_...

# Google Sheets
GOOGLE_CREDENTIALS_PATH=/path/to/credentials.json
GOOGLE_SHEETS_CUSTOMER_CONFIG_ID=spreadsheet_id_1
GOOGLE_SHEETS_ARTICLES_ID=spreadsheet_id_2

# Vercel
NEXT_PUBLIC_VERCEL_URL=your_vercel_domain.com
\`\`\`

### Supabase Setup

1. Create a Supabase project
2. Run the following SQL to create required tables:

\`\`\`sql
-- User profiles
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  subscription_status text DEFAULT 'trial',
  subscription_plan text DEFAULT 'free',
  stripe_customer_id text UNIQUE
);

-- Onboarding data
CREATE TABLE public.onboarding_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  style_samples text[] DEFAULT '{}',
  subjects text[] DEFAULT '{}',
  email text,
  display_name text,
  preferred_language text DEFAULT 'en',
  delivery_days text[] DEFAULT '{}',
  sheets_config_id text,
  sheets_subjects_id text,
  completed_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Articles
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status text DEFAULT 'draft',
  content text,
  generated_at timestamp,
  sent_at timestamp,
  created_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own onboarding data" ON public.onboarding_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding data" ON public.onboarding_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding data" ON public.onboarding_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own articles" ON public.articles
  FOR SELECT USING (auth.uid() = user_id);
\`\`\`

### Stripe Setup

1. Create a Stripe account and get API keys from https://dashboard.stripe.com/test/apikeys
2. Create two products in Stripe Dashboard:
   - **Pro Plan**: $70/month (with 7-day trial)
   - **Enterprise Plan**: $299/month
3. Copy Price IDs to environment variables (`STRIPE_PRICE_PRO_ID`, `STRIPE_PRICE_ENTERPRISE_ID`)
4. Set up webhook endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.trial_will_end`
5. For local development, use Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

See `docs/STRIPE_INTEGRATION.md` for complete setup guide.

### Google Sheets Setup

1. Create a Google Cloud project
2. Enable Sheets API and Service Accounts
3. Download credentials JSON and place in project root
4. Create two Google Sheets:
   - Spreadsheet 1: Customer config tracking
   - Spreadsheet 2: Individual customer article sheets
5. Copy sheet IDs to environment variables

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy:
   \`\`\`bash
   vercel --prod
   \`\`\`

### Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Supabase production database configured
- [ ] Stripe production keys in use
- [ ] Google Sheets API credentials secure
- [ ] Database backups enabled
- [ ] CDN caching configured
- [ ] Email verification enabled
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Rate limiting enabled
- [ ] Monitoring/logging configured

## API Reference

### Authentication

- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out

### Onboarding

- `POST /api/onboarding/step-1` - Save style samples
- `POST /api/onboarding/step-2` - Save subjects
- `POST /api/onboarding/step-3` - Complete onboarding (provisions Sheets)

### Dashboard

- `GET /api/dashboard/metrics` - Fetch metrics and settings
- `PUT /api/dashboard/settings` - Update preferences

### Payments & Billing

- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/webhook` - Stripe webhook handler
- `POST /api/stripe/portal` - Customer portal session
- `GET /api/stripe/subscription` - Get subscription details
- `DELETE /api/stripe/subscription` - Cancel subscription
- `GET /api/stripe/usage` - Get usage statistics
- `POST /api/stripe/change-plan` - Upgrade/downgrade plan

## Database Schema

All tables use Row Level Security (RLS) with policies ensuring users only access their own data. Foreign keys cascade on delete for data integrity.

## Performance Optimization

- Image optimization via Next.js Image component
- API route caching with Vercel's cache control
- Database query optimization with indexed fields
- Client-side state management with auth context
- Code splitting and lazy loading
- CSS-in-JS with Tailwind for minimal bundle

## Security

- Row Level Security on all Supabase tables
- HTTPS enforced in production
- Environment variables never exposed to client
- Stripe API keys server-side only
- Google Sheets credentials not in version control
- CORS policies properly configured

## Testing

\`\`\`bash
# Run tests
npm run test

# Test coverage
npm run test:coverage
\`\`\`

## Troubleshooting

### Common Issues

**Supabase Connection Error**
- Verify URL and anon key in .env.local
- Check network connectivity
- Ensure RLS policies are correct

**Stripe Webhook Not Firing**
- Verify webhook URL in Stripe dashboard
- Check webhook secret matches environment variable
- Ensure POST requests are accepted

**Google Sheets Write Fails**
- Verify credentials.json path
- Ensure service account has sheet editor permissions
- Check spreadsheet IDs are correct

## Documentation

Additional documentation is available in the `docs/` folder:
- `docs/DEPLOYMENT.md` - Production deployment guide
- `docs/STRIPE_INTEGRATION.md` - Complete Stripe billing setup
- `docs/STRIPE_QUICK_START.md` - 5-minute Stripe setup
- `docs/STRIPE_IMPLEMENTATION_SUMMARY.md` - Technical implementation details

## Support

For issues or questions:
- Documentation: See `docs/` folder
- Email: support@articleforge.com
- Issues: GitHub issue tracker

## License

Proprietary - ArticleForge Pro
