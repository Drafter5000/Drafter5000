# UX Flow Improvements & Recommendations

> **Document Created:** December 15, 2025  
> **Status:** Proposed  
> **Priority Legend:** 🔴 High | 🟡 Medium | 🟢 Low

---

## Table of Contents

1. [Onboarding Flow](#1-onboarding-flow-)
2. [Payment/Subscription Flow](#2-paymentsubscription-flow-)
3. [Authentication Flow](#3-authentication-flow-)
4. [Dashboard UX](#4-dashboard-ux-)
5. [Error Handling & Recovery](#5-error-handling--recovery-)
6. [Subscription Renewal Flow](#6-subscription-renewal-flow-)
7. [Quick Wins](#7-quick-wins-)
8. [Implementation Priority](#8-implementation-priority)

---

## 1. Onboarding Flow 🔴

### Current Issues

| Issue                                                                                              | Impact                                |
| -------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Step 3 collects too much information at once (name, email, password, job, delivery days, language) | High friction, increased drop-off     |
| No progress persistence to server until final step                                                 | Users lose all data if browser closes |
| LinkedIn users must enter job title manually                                                       | Redundant data entry, poor UX         |

### Recommendations

#### 1.1 Split Step 3 into Two Steps

**Before:**

```
Step 1: Writing Style → Step 2: Topics → Step 3: Account + Preferences
```

**After:**

```
Step 1: Writing Style → Step 2: Topics → Step 3: Preferences →  Step 4: Account Creation
```

**Step 3 (Preferences):**

- Job Title
- Delivery Days
- Article Language

**Step 4 (Account Creation):**

- Full Name
- Email Address
- Password / Confirm Password

#### 1.2 Add Server-Side Draft Persistence

```typescript
// Save draft after each step completion
await apiClient.post('/onboarding/draft', {
  user_id: sessionId, // Anonymous session ID
  step: currentStep,
  data: stepData,
});
```

**Benefits:**

- Prevents data loss on browser close
- Enables cross-device continuation
- Allows abandoned cart recovery emails

#### 1.3 Pre-fill Job from LinkedIn Metadata

```typescript
// In auth/callback/route.ts - already available
const linkedInJob = user.user_metadata?.headline || user.user_metadata?.position || '';

// Pass to step-3 via query param or session
return NextResponse.redirect(
  `${origin}/articles/generate/step-3?provider=linkedin&job=${encodeURIComponent(linkedInJob)}`
);
```

---

## 2. Payment/Subscription Flow 🔴

### Current Issues

| Issue                                             | Impact                                |
| ------------------------------------------------- | ------------------------------------- |
| Webhook may not process before dashboard redirect | Users see "incomplete" status briefly |
| No retry mechanism for failed webhook processing  | Manual intervention required          |
| Style data activation depends on webhook success  | Users may pay but not get access      |

### Recommendations

#### 2.1 Implement Optimistic UI with Polling

```typescript
// After Stripe redirect, poll for status update
const PaymentVerification = ({ sessionId }) => {
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const pollStatus = async () => {
      for (let i = 0; i < 10; i++) {
        const result = await apiClient.get(`/stripe/verify-session/${sessionId}`);
        if (result.subscription_status === 'active') {
          setStatus('success');
          router.push('/dashboard?payment_success=true');
          return;
        }
        await sleep(2000); // Wait 2 seconds between polls
      }
      setStatus('pending'); // Show manual verification option
    };
    pollStatus();
  }, [sessionId]);

  return <VerificationUI status={status} />;
};
```

#### 2.2 Add Webhook Retry Queue

```sql
-- Create failed_webhooks table
CREATE TABLE failed_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

```typescript
// In webhook handler
try {
  await processWebhookEvent(event);
} catch (error) {
  await supabase.from('failed_webhooks').insert({
    event_type: event.type,
    event_id: event.id,
    payload: event.data,
    error_message: error.message,
    next_retry_at: new Date(Date.now() + 5 * 60 * 1000), // 5 min
  });
}
```

#### 2.3 Add Grace Period Handling

```typescript
// If subscription is "incomplete" but recent checkout exists
async function verifySubscriptionWithStripe(userId: string) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  const subscriptions = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length > 0) {
    // Update local status to match Stripe
    await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'active',
      })
      .eq('id', userId);
    return true;
  }
  return false;
}
```

---

## 3. Authentication Flow 🟡

### Current Issues

| Issue                                              | Impact                              |
| -------------------------------------------------- | ----------------------------------- |
| "Forgot Password" link not prominent               | Users may create duplicate accounts |
| No "Remember me" option                            | Frequent re-authentication required |
| LinkedIn users who abandon onboarding can't resume | Lost conversion opportunity         |

### Recommendations

#### 3.1 Add Prominent "Forgot Password" Link

```tsx
// In login/page.tsx - below password field
<div className="flex items-center justify-between">
  <Label htmlFor="password">Password</Label>
  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
    Forgot password?
  </Link>
</div>
```

#### 3.2 Add Session Persistence Option

```tsx
// Add checkbox before submit button
<div className="flex items-center gap-2">
  <Checkbox id="remember" checked={rememberMe} onCheckedChange={setRememberMe} />
  <Label htmlFor="remember" className="text-sm text-muted-foreground">
    Remember me for 30 days
  </Label>
</div>;

// In handleLogin
const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
  options: {
    // Extend session if "remember me" is checked
    ...(rememberMe && { expiresIn: 60 * 60 * 24 * 30 }), // 30 days
  },
});
```

#### 3.3 Resume Incomplete Onboarding for LinkedIn Users

```typescript
// In auth/callback/route.ts
if (profile && isOAuthUser && !profile.onboarding_completed) {
  // Check which step they were on
  const { data: pendingStyle } = await supabase
    .from('pending_style_data')
    .select('style_samples, subjects')
    .eq('user_id', user.id)
    .single();

  if (!pendingStyle) {
    return NextResponse.redirect(`${origin}/articles/generate/step-1?provider=linkedin`);
  } else if (!pendingStyle.subjects?.length) {
    return NextResponse.redirect(`${origin}/articles/generate/step-2?provider=linkedin`);
  } else {
    return NextResponse.redirect(`${origin}/articles/generate/step-3?provider=linkedin`);
  }
}
```

---

## 4. Dashboard UX 🟡

### Current Issues

| Issue                                            | Impact                        |
| ------------------------------------------------ | ----------------------------- |
| Topics fetched from Google Sheets on every load  | Slow, unreliable              |
| No loading skeleton for individual topic updates | Jarring UX                    |
| Status change lacks immediate feedback           | Users unsure if action worked |

### Recommendations

#### 4.1 Implement SWR for Topics Caching

```typescript
import useSWR from 'swr';

function useTopics() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/topics',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    topics: data?.topics || [],
    isLoading,
    error,
    refresh: mutate,
    lastUpdated: data?.timestamp,
  };
}

// In dashboard
const { topics, lastUpdated, refresh } = useTopics();

<div className="flex items-center gap-2 text-xs text-muted-foreground">
  <Clock className="h-3 w-3" />
  Last synced: {formatRelativeTime(lastUpdated)}
  <Button variant="ghost" size="sm" onClick={refresh}>
    <RefreshCw className="h-3 w-3" />
  </Button>
</div>
```

#### 4.2 Add Optimistic Updates for Status Changes

```typescript
const handleStatusChange = async (topicId: number, newStatus: string) => {
  // Optimistic update
  const previousTopics = topics;
  setTopics(topics.map(t => (t.rowIndex === topicId ? { ...t, status: newStatus } : t)));

  try {
    await apiClient.put(`/topics/${topicId}`, { status: newStatus });
  } catch (error) {
    // Revert on error
    setTopics(previousTopics);
    toast.error('Failed to update status');
  }
};
```

#### 4.3 Add Inline Editing with Auto-Save

```typescript
const [editingTopic, setEditingTopic] = useState<string>('');
const debouncedSave = useDebouncedCallback(async (rowIndex, value) => {
  await apiClient.put(`/topics/${rowIndex}`, { topic: value });
}, 1000);

<Input
  value={editingTopic}
  onChange={(e) => {
    setEditingTopic(e.target.value);
    debouncedSave(topic.rowIndex, e.target.value);
  }}
  className="border-none focus:ring-1"
/>
```

---

## 5. Error Handling & Recovery 🟡

### Current Issues

| Issue                                        | Impact                             |
| -------------------------------------------- | ---------------------------------- |
| Generic error messages                       | Users don't know how to fix issues |
| No automatic retry for transient failures    | Manual refresh required            |
| Webhook failures require manual intervention | Delayed access for users           |

### Recommendations

#### 5.1 Specific Error Messages with Guidance

```typescript
const ERROR_MESSAGES: Record<string, { message: string; action: string }> = {
  card_declined: {
    message: 'Your card was declined',
    action: 'Please try a different payment method',
  },
  session_expired: {
    message: 'Your session has expired',
    action: 'Please log in again to continue',
  },
  rate_limit: {
    message: 'Too many requests',
    action: 'Please wait a moment and try again',
  },
  network_error: {
    message: 'Connection lost',
    action: 'Check your internet connection and try again',
  },
};

function getErrorDisplay(errorCode: string) {
  return (
    ERROR_MESSAGES[errorCode] || {
      message: 'Something went wrong',
      action: 'Please try again or contact support',
    }
  );
}
```

#### 5.2 Automatic Retry with Exponential Backoff

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }

  throw lastError!;
}
```

#### 5.3 Error Boundary with Recovery Options

```tsx
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {error.message || 'An unexpected error occurred'}
      </p>
      <div className="flex gap-3">
        <Button onClick={resetErrorBoundary}>Try Again</Button>
        <Button variant="outline" asChild>
          <a href="mailto:support@drafter.com">Contact Support</a>
        </Button>
      </div>
    </div>
  );
}
```

---

## 6. Subscription Renewal Flow 🟢

### Current Issues

| Issue                                                   | Impact                        |
| ------------------------------------------------------- | ----------------------------- |
| Users with `past_due` status see unclear read-only mode | Confusion about account state |
| No proactive notification before expiration             | Surprise subscription loss    |
| Renewal banner could be more prominent                  | Missed renewal opportunities  |

### Recommendations

#### 6.1 Email Notification Schedule

| Trigger                  | Email Type | Content                               |
| ------------------------ | ---------- | ------------------------------------- |
| 7 days before expiration | Reminder   | "Your subscription expires in 7 days" |
| 3 days before expiration | Urgent     | "Don't lose access - renew now"       |
| On expiration            | Notice     | "Your subscription has expired"       |
| 3 days after expiration  | Win-back   | "We miss you - 10% off to come back"  |

#### 6.2 In-App Notification System

```tsx
function NotificationBell() {
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs flex items-center justify-center text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <NotificationList notifications={notifications} />
      </PopoverContent>
    </Popover>
  );
}
```

#### 6.3 Prominent Renewal CTA

```tsx
// Sticky banner for expired/past_due subscriptions
{
  !canAccessFeatures && (
    <div className="fixed top-16 left-0 right-0 z-40 bg-destructive text-destructive-foreground py-3 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">
            Your subscription has expired. Renew now to continue creating articles.
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRenewSubscription}>
          Renew Now
        </Button>
      </div>
    </div>
  );
}
```

---

## 7. Quick Wins 🟢

| Issue                                       | Fix                                       | Effort  |
| ------------------------------------------- | ----------------------------------------- | ------- |
| No loading state when changing topic status | Add spinner to status dropdown            | 1 hour  |
| Password requirements not shown until error | Show requirements below password field    | 30 min  |
| No confirmation before logout               | Add "Are you sure?" dialog                | 1 hour  |
| Subscription page shows all plans equally   | Highlight recommended plan based on usage | 2 hours |
| No keyboard shortcuts                       | Add Cmd+K for quick actions               | 4 hours |
| No toast notifications for actions          | Add sonner/react-hot-toast                | 2 hours |
| Form doesn't show which fields have errors  | Add red border + icon to invalid fields   | 1 hour  |

### Example: Password Requirements Display

```tsx
<div className="space-y-2">
  <Label htmlFor="password">Password</Label>
  <Input
    id="password"
    type="password"
    value={password}
    onChange={e => setPassword(e.target.value)}
  />
  <div className="text-xs text-muted-foreground space-y-1">
    <p className={password.length >= 8 ? 'text-green-600' : ''}>
      {password.length >= 8 ? '✓' : '○'} At least 8 characters
    </p>
    <p className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
      {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
    </p>
    <p className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
      {/[0-9]/.test(password) ? '✓' : '○'} One number
    </p>
  </div>
</div>
```

---

## 8. Implementation Priority

### Phase 1: Critical (Week 1-2)

1. ✅ Payment flow reliability (polling + retry queue)
2. ✅ Webhook failure recovery mechanism
3. ✅ Specific error messages

### Phase 2: High Impact (Week 3-4)

4. ✅ Onboarding step split
5. ✅ Server-side draft persistence
6. ✅ Dashboard topics caching (SWR)

### Phase 3: Polish (Week 5-6)

7. ✅ Authentication enhancements
8. ✅ Optimistic UI updates
9. ✅ Quick wins implementation

### Phase 4: Nice to Have (Backlog)

10. ⬜ Email notification system
11. ⬜ In-app notifications
12. ⬜ Keyboard shortcuts

---

## Metrics to Track

| Metric                           | Current | Target | How to Measure         |
| -------------------------------- | ------- | ------ | ---------------------- |
| Onboarding completion rate       | TBD     | +20%   | Funnel analytics       |
| Payment success rate             | TBD     | 99%+   | Stripe dashboard       |
| Support tickets (payment issues) | TBD     | -50%   | Support system         |
| Dashboard load time              | TBD     | <2s    | Performance monitoring |
| User retention (30-day)          | TBD     | +15%   | Analytics              |

---

## Questions for Discussion

1. Should we implement a free trial period before requiring payment?
2. What's the acceptable delay between payment and feature activation?
3. Should expired users retain read-only access or be fully locked out?
4. Do we want to support multiple payment methods (Apple Pay, Google Pay)?

---

_Document maintained by the Engineering Team_
