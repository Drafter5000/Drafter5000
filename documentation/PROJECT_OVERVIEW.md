# Drafter - AI Article Generation SaaS Platform

## Project Overview & Architecture

A Next.js 16 SaaS application that enables customers to configure article styles and subjects, which are then processed by an n8n workflow engine to generate AI-powered articles and deliver them via email.

---

## System Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DRAFTER SYSTEM FLOW                                │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐                    ┌──────────────────────┐
    │  Client User │ ──── Subscribe ───▶│   Stripe Billing     │
    │    (Bob)     │                    │  (Payment Gateway)   │
    └──────┬───────┘                    └──────────┬───────────┘
           │                                       │
           │ Adds Subject/Settings                 │ Webhook: subscription.created
           ▼                                       ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                    NEXT.JS SAAS APP                          │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
    │  │ Auth Module │  │  Dashboard  │  │  Article Styles     │  │
    │  │ (Supabase)  │  │  (Metrics)  │  │  (3-Step Wizard)    │  │
    │  └─────────────┘  └─────────────┘  └─────────────────────┘  │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
    │  │ Admin Panel │  │  Billing    │  │  Webhook Handler    │  │
    │  │ (Super/Org) │  │  (Stripe)   │  │  (Signature Verify) │  │
    │  └─────────────┘  └─────────────┘  └─────────────────────┘  │
    └──────────────────────────┬───────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │   Postgres   │    │Google Sheets │    │   Webhook    │
    │  (Supabase)  │    │ (Append Row) │    │  Endpoint    │
    └──────────────┘    └──────┬───────┘    └──────┬───────┘
                               │                   │
                               │ Detect New Row    │ Callback (Signed)
                               ▼                   │
                        ┌──────────────┐           │
                        │ n8n Workflow │◀──────────┘
                        │   Engine     │
                        └──────┬───────┘
                               │
                               │ Generate Article + Send Email
                               ▼
                        ┌──────────────┐
                        │   Customer   │
                        │    Email     │
                        └──────────────┘
```

---

## Tech Stack

| Layer                | Technology                           | Purpose               |
| -------------------- | ------------------------------------ | --------------------- |
| Frontend             | Next.js 16, React 19, Tailwind CSS 4 | UI/UX                 |
| UI Components        | Radix UI, shadcn/ui                  | Accessible components |
| Backend              | Next.js API Routes, Server Actions   | Business logic        |
| Database             | PostgreSQL (Supabase)                | Data persistence      |
| Auth                 | Supabase Auth                        | User authentication   |
| Payments             | Stripe                               | Subscription billing  |
| External Integration | Google Sheets API                    | n8n trigger source    |
| AI                   | OpenAI GPT-4o-mini                   | Topic suggestions     |
| Workflow             | n8n (External)                       | Article generation    |

---

## ✅ COMPLETED FEATURES

### 1. Authentication System

**Status:** ✅ Complete

| File                           | Function                    | Description                                      |
| ------------------------------ | --------------------------- | ------------------------------------------------ |
| `lib/supabase-client.ts`       | `getServerSupabaseClient()` | Server-side Supabase client with cookie handling |
| `lib/supabase-browser.ts`      | `createBrowserClient()`     | Client-side Supabase instance                    |
| `lib/supabase-admin.ts`        | `getSupabaseAdmin()`        | Admin client for webhook/background operations   |
| `app/api/auth/login/route.ts`  | POST handler                | Email/password authentication                    |
| `app/api/auth/signup/route.ts` | POST handler                | User registration with profile creation          |
| `middleware.ts`                | Route protection            | Subscription-gated access control                |

**Key Implementation:**

```typescript
// middleware.ts - Subscription-based route protection
const subscriptionRequiredRoutes = ['/dashboard', '/articles'];
// Only 'active' subscription grants access (no trial mode)
const hasActiveSubscription = profile?.subscription_status === 'active';
```

---

### 2. Stripe Billing Integration

**Status:** ✅ Complete

| File                               | Function                  | Description                   |
| ---------------------------------- | ------------------------- | ----------------------------- |
| `lib/stripe-client.ts`             | `getStripeClient()`       | Singleton Stripe SDK instance |
| `app/api/stripe/webhook/route.ts`  | POST handler              | Handles all Stripe events     |
| `app/api/stripe/checkout/route.ts` | POST handler              | Creates checkout sessions     |
| `app/api/stripe/portal/route.ts`   | POST handler              | Customer portal access        |
| `lib/services/billing.ts`          | `getBillingStatus()`      | Organization billing info     |
| `lib/plan-utils.ts`                | `getPlanByPriceIdAdmin()` | Dynamic plan lookup from DB   |

**Webhook Events Handled:**

- `checkout.session.completed` - Activates subscription
- `customer.subscription.updated` - Plan changes
- `customer.subscription.deleted` - Cancellation
- `invoice.payment_succeeded` - Payment confirmation
- `invoice.payment_failed` - Payment failure handling

**Database Tables:**

- `user_profiles` - Stores `subscription_status`, `subscription_plan`, `stripe_customer_id`
- `subscriptions` - Full subscription history with period tracking
- `subscription_plans` - Dynamic plan configuration (no hardcoded plans)

---

### 3. Google Sheets Integration

**Status:** ✅ Complete

| File                   | Function                   | Description                        |
| ---------------------- | -------------------------- | ---------------------------------- |
| `lib/google-sheets.ts` | `getGoogleSheetsClient()`  | Authenticated Sheets API client    |
| `lib/google-sheets.ts` | `appendToMainSheet()`      | Adds customer config (17 columns)  |
| `lib/google-sheets.ts` | `createCustomerSheet()`    | Creates per-customer subject sheet |
| `lib/google-sheets.ts` | `appendToCustomersSheet()` | Adds subject entries               |

**Main Sheet Structure (17 columns A-Q):**

```
Sheet Name | Customer Name | Email | Language | Mon-Sun (7 cols) |
Paywall Status | End of Membership | Sheet Created | Article Examples (3)
```

**Customer Sheet Structure (6 columns):**

```
Question | Status | Subject | Article | Last Update | Client
```

---

### 4. Article Styles System (3-Step Wizard)

**Status:** ✅ Complete

| File                             | Function               | Description                     |
| -------------------------------- | ---------------------- | ------------------------------- |
| `lib/services/article-styles.ts` | `createArticleStyle()` | Creates new style configuration |
| `lib/services/article-styles.ts` | `saveDraft()`          | Persists wizard progress        |
| `lib/services/article-styles.ts` | `completeDraft()`      | Activates completed style       |
| `app/api/article-styles/step-1/` | POST handler           | Style samples submission        |
| `app/api/article-styles/step-2/` | POST handler           | Subjects configuration          |
| `app/api/article-styles/step-3/` | POST handler           | Delivery settings               |

**Wizard Flow:**

1. **Step 1:** Upload 3 article samples (style analysis)
2. **Step 2:** Define subjects/topics (AI suggestions available)
3. **Step 3:** Configure delivery (email, language, schedule)

---

### 5. AI Topic Suggestions

**Status:** ✅ Complete

| File                              | Function                     | Description                     |
| --------------------------------- | ---------------------------- | ------------------------------- |
| `lib/services/openai.ts`          | `generateTopicSuggestions()` | GPT-4o-mini powered suggestions |
| `app/api/ai/suggestions/route.ts` | POST handler                 | API endpoint for suggestions    |

**Implementation:**

```typescript
// Analyzes style samples to suggest relevant topics
const suggestions = await generateTopicSuggestions(
  styleSamples, // User's writing samples
  existingTopics, // Already added topics (avoid duplicates)
  count // Number of suggestions (default: 8)
);
```

---

### 6. Super Admin Dashboard

**Status:** ✅ Complete

| File                                  | Function                | Description               |
| ------------------------------------- | ----------------------- | ------------------------- |
| `lib/admin-auth.ts`                   | `validateAdminAccess()` | Checks admin privileges   |
| `lib/admin-auth.ts`                   | `requireSuperAdmin()`   | Guards super admin routes |
| `lib/services/admin-metrics.ts`       | `getDashboardMetrics()` | Platform-wide statistics  |
| `lib/services/admin-organizations.ts` | CRUD operations         | Organization management   |
| `lib/services/admin-users.ts`         | CRUD operations         | User management           |
| `lib/services/audit-log.ts`           | `createAuditLog()`      | Action tracking           |

**Admin Routes:**

- `/admin` - Dashboard overview
- `/admin/users` - User management
- `/admin/organizations` - Organization management
- `/admin/billing` - Billing overview
- `/admin/usage` - Usage metrics
- `/admin/plans` - Plan configuration
- `/admin/settings` - Platform settings

**Role Hierarchy:**

```typescript
enum UserRoleType {
  CUSTOMER = 'customer', // Regular user
  CUSTOMER_ADMIN = 'customer_admin', // Org-level admin
  SUPER_ADMIN = 'super_admin', // Platform admin
}
```

---

### 7. Multi-Tenant Organization System

**Status:** ✅ Complete

| File                        | Function             | Description            |
| --------------------------- | -------------------- | ---------------------- |
| `lib/organization-utils.ts` | Organization helpers | Org context management |
| `lib/services/org-scope.ts` | Scoped queries       | Data isolation         |
| `app/api/user/switch-org/`  | POST handler         | Organization switching |

**Database Schema:**

- `organizations` - Org details, settings, active status
- `organization_members` - User-org relationships with roles
- `organization_invitations` - Pending invites with tokens

---

### 8. Usage Tracking & Limits

**Status:** ✅ Complete

| File                    | Function                    | Description             |
| ----------------------- | --------------------------- | ----------------------- |
| `lib/services/usage.ts` | `getUsageMetrics()`         | Per-org usage stats     |
| `lib/services/usage.ts` | `getPlatformUsageMetrics()` | Platform-wide stats     |
| `lib/usage-limits.ts`   | Limit enforcement           | Plan-based restrictions |

**Tracked Metrics:**

- Article count (total & monthly)
- Storage usage (estimated)
- API calls
- Member count
- Last activity timestamp

---

### 9. Dashboard & User Settings

**Status:** ✅ Complete

| File                       | Function                | Description             |
| -------------------------- | ----------------------- | ----------------------- |
| `app/actions/dashboard.ts` | `getArticles()`         | Fetch user's articles   |
| `app/actions/dashboard.ts` | `getDashboardMetrics()` | User statistics         |
| `app/actions/dashboard.ts` | `updateUserSettings()`  | Profile updates         |
| `app/dashboard/page.tsx`   | Dashboard UI            | Main user interface     |
| `app/dashboard/settings/`  | Settings pages          | User preferences        |
| `app/dashboard/billing/`   | Billing pages           | Subscription management |

---

## 🔄 PENDING / IN PROGRESS

### 1. n8n Webhook Integration

**Status:** 🔄 Pending

**Required Implementation:**

```typescript
// app/api/webhook/n8n/route.ts (TO BE CREATED)
export async function POST(request: NextRequest) {
  // 1. Verify signature from n8n
  const signature = headers.get('x-n8n-signature');
  const isValid = verifySignature(body, signature, secret);

  // 2. Parse article data
  const { articleId, content, status } = await request.json();

  // 3. Store generated article
  await supabase
    .from('articles')
    .update({
      content,
      status: 'generated',
      generated_at: new Date().toISOString(),
    })
    .eq('id', articleId);

  // 4. Update Google Sheets status
  await updateSheetStatus(articleId, 'generated');
}
```

**n8n Workflow Requirements:**

- Trigger: Google Sheets new row detection
- Process: AI article generation (external)
- Output: Webhook callback with signed payload

---

### 2. Email Delivery Tracking

**Status:** 🔄 Pending

**Required Fields in `articles` table:**

- `sent_at` - Email delivery timestamp
- `email_status` - 'pending' | 'sent' | 'failed' | 'bounced'
- `email_provider_id` - External tracking ID

---

### 3. Article Content Storage & Display

**Status:** 🔄 Partial

**Completed:**

- Database schema for articles
- Basic CRUD operations

**Pending:**

- Rich text editor for article preview
- Article history/versioning
- Export functionality (PDF, HTML)

---

## 💡 COST-EFFECTIVE RECOMMENDATIONS

### 1. Infrastructure Optimization

| Current      | Recommendation                        | Savings |
| ------------ | ------------------------------------- | ------- |
| Supabase Pro | Start with Free tier (500MB, 50K MAU) | ~$25/mo |
| Vercel Pro   | Hobby plan for MVP                    | ~$20/mo |
| OpenAI GPT-4 | Use GPT-4o-mini (10x cheaper)         | ~70%    |

### 2. n8n Deployment Options

| Option                | Cost   | Pros              | Cons                 |
| --------------------- | ------ | ----------------- | -------------------- |
| n8n Cloud Starter     | $20/mo | Managed, reliable | Limited executions   |
| Self-hosted (Railway) | ~$5/mo | Full control      | Maintenance required |
| Self-hosted (Hetzner) | ~$4/mo | Cheapest          | More setup           |

**Recommendation:** Start with n8n Cloud Starter for reliability, migrate to self-hosted when volume increases.

### 3. Google Sheets Optimization

**Current:** Direct API calls per operation
**Recommendation:** Batch operations where possible

```typescript
// Instead of multiple appendToSheet calls
await sheets.spreadsheets.values.batchUpdate({
  spreadsheetId,
  requestBody: {
    valueInputOption: 'RAW',
    data: [
      { range: 'Sheet1!A1', values: [[...]] },
      { range: 'Sheet2!A1', values: [[...]] },
    ]
  }
});
```

### 4. Caching Strategy

**Implement Redis/Upstash for:**

- Plan data (changes rarely)
- User session data
- Rate limiting

**Cost:** Upstash free tier = 10K commands/day

### 5. Monitoring & Alerting

**Free Options:**

- Vercel Analytics (included)
- Supabase Dashboard (included)
- Sentry Free (5K errors/mo)
- Better Stack Free (basic uptime)

---

## 📊 Database Schema Summary

```sql
-- Core Tables
user_profiles          -- User data, subscription info
organizations          -- Multi-tenant orgs
organization_members   -- User-org relationships
subscriptions          -- Stripe subscription sync
subscription_plans     -- Dynamic plan config
plan_features          -- Plan feature list

-- Article System
articles               -- Generated content
article_styles         -- Style configurations
onboarding_data        -- User preferences

-- Admin
audit_logs             -- Admin action tracking
```

---

## 🔐 Security Checklist

| Feature              | Status | Implementation              |
| -------------------- | ------ | --------------------------- |
| Auth                 | ✅     | Supabase Auth with RLS      |
| API Protection       | ✅     | Middleware route guards     |
| Webhook Verification | ✅     | Stripe signature validation |
| Admin Access         | ✅     | Role-based with audit logs  |
| Data Isolation       | ✅     | Organization-scoped queries |
| CSRF Protection      | ✅     | Next.js built-in            |
| Rate Limiting        | 🔄     | Pending implementation      |

---

## 🚀 Deployment Checklist

### Environment Variables Required:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Google Sheets
GOOGLE_CREDENTIALS_PATH=
GOOGLE_SHEETS_CONFIG_SPREADSHEET_ID=
GOOGLE_SHEETS_MAIN_SHEET_NAME=

# OpenAI
OPENAI_API_KEY=

# n8n (Pending)
N8N_WEBHOOK_SECRET=
```

---

## Summary

**Completed:** ~85% of core functionality

- Full auth & billing flow
- Google Sheets integration
- Article styles wizard
- Admin dashboard
- Multi-tenant support

**Remaining:** ~15%

- n8n webhook callback handler
- Email delivery tracking
- Article content display enhancements

**Estimated Time to MVP:** 2-3 days of development

---

_Generated: December 8, 2025_
