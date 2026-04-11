# Subscriptions, Plans & Feature Limits

> End-to-end reference for how Sendora handles plan tiers, Stripe billing, and feature enforcement.

---

## Table of Contents

1. [Data model](#1-data-model)
2. [Plans & features seed](#2-plans--features-seed)
3. [User flows](#3-user-flows)
   - [New user — free plan](#31-new-user--free-plan)
   - [New user — paid plan](#32-new-user--paid-plan)
   - [Existing user — change plan](#33-existing-user--change-plan)
   - [Existing user — cancel subscription](#34-existing-user--cancel-subscription)
   - [Existing user — manage payment method](#35-existing-user--manage-payment-method)
4. [Stripe integration](#4-stripe-integration)
   - [Checkout session](#41-checkout-session)
   - [Billing portal](#42-billing-portal)
   - [Webhook events](#43-webhook-events)
5. [Feature enforcement](#5-feature-enforcement)
6. [File map](#6-file-map)
7. [Environment variables](#7-environment-variables)
8. [Local development setup](#8-local-development-setup)
9. [Adding a new feature gate](#9-adding-a-new-feature-gate)
10. [Adding a new plan](#10-adding-a-new-plan)

---

## 1. Data model

```
Plan ──< PlanFeature >── Feature
 │
 └──< WorkspaceSubscription >── Workspace ──< WorkspaceFeature >── Feature
```

### Key tables

| Table                   | Purpose                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `Plan`                  | Tier definitions — name, price, Stripe price IDs                                    |
| `Feature`               | Feature catalog — identified by `code` (e.g. `MAX_DOMAINS`)                         |
| `PlanFeature`           | Maps a Feature to a Plan with an optional `limitValue`                              |
| `WorkspaceSubscription` | The active subscription record per workspace — status, billing interval, Stripe IDs |
| `WorkspaceFeature`      | Admin-level per-workspace overrides — can raise or lower any limit, set expiry      |

### `WorkspaceSubscription` status lifecycle

```
(checkout created)
       │
       ▼
  TRIALING ──► ACTIVE ──► PAST_DUE ──► CANCELLED
                 │                          ▲
                 └──── cancelAtPeriodEnd ───┘
                       (stays ACTIVE until
                        period end, then
                        Stripe fires deleted)
```

| Status      | Meaning                            |
| ----------- | ---------------------------------- |
| `TRIALING`  | Trial period active                |
| `ACTIVE`    | Paid and current                   |
| `PAST_DUE`  | Last invoice failed — grace period |
| `CANCELLED` | Subscription ended                 |
| `EXPIRED`   | Period ended after cancellation    |

### `Plan` schema additions (Stripe)

```prisma
model Plan {
  stripePriceIdMonthly String?   // Stripe Price ID — monthly billing
  stripePriceIdYearly  String?   // Stripe Price ID — yearly billing
  // STANDARD (free) plan leaves both null
}

model Workspace {
  stripeCustomerId String? @unique  // set on first paid checkout
}
```

---

## 2. Plans & features seed

Defined in `prisma/seed.ts`, applied with `bun prisma db seed`.

### Features

| Code                   | Name             | Description                            |
| ---------------------- | ---------------- | -------------------------------------- |
| `MAX_DOMAINS`          | Domains          | Maximum domains per workspace          |
| `MAX_CONTACTS`         | Contacts         | Maximum contacts (leads) per workspace |
| `MAX_EMAILS_PER_MONTH` | Emails per month | Monthly email send quota               |

### Plans

| Code       | Name     | Monthly | Yearly | Domains   | Contacts | Emails/mo |
| ---------- | -------- | ------- | ------ | --------- | -------- | --------- |
| `STANDARD` | Standard | $0      | $0     | 1         | 10       | 10        |
| `PLUS`     | Plus     | $67     | $670   | 2         | 50       | 50        |
| `ULTIMATE` | Ultimate | $97     | $970   | Unlimited | 500      | 500       |

`limitValue: null` in `PlanFeature` means **unlimited** for that feature.

---

## 3. User flows

### 3.1 New user — free plan

```
/sign-up (Clerk)
    │
    ▼
/onboarding
  Step 1 — Profile     → update first/last name (updateUserAction)
  Step 2 — Workspace   → createWorkspaceAction → returns { workspaceId }
  Step 3 — Plan        → user selects STANDARD
                        → selectPlanAction
                          → createSubscription(status: ACTIVE, billingInterval: MONTHLY)
                          → redirect('/dashboard')
```

No Stripe involved. Subscription is created directly in the DB with `status: ACTIVE`.

---

### 3.2 New user — paid plan

```
/sign-up (Clerk)
    │
    ▼
/onboarding
  Step 1 — Profile
  Step 2 — Workspace   → createWorkspaceAction → returns { workspaceId }
  Step 3 — Plan        → user selects PLUS or ULTIMATE + billing interval
                        → selectPlanAction
                          → create Stripe Customer (if none exists on workspace)
                          → save stripeCustomerId to Workspace
                          → stripe.checkout.sessions.create(...)
                          → redirect(session.url)  ← server action redirect to Stripe
    │
    ▼
Stripe Hosted Checkout
    │
    ├─ success → /dashboard?subscription=success
    └─ cancel  → /onboarding
    │
    ▼ (async, via Stripe CLI / webhook)
POST /api/stripe/webhooks
  checkout.session.completed
    → stripe.subscriptions.retrieve(session.subscription)
    → createSubscription(status: ACTIVE, stripeSubscriptionId, stripePriceId, period)
```

The user lands on `/dashboard` before or after the webhook fires — both are valid.
The subscription record may appear slightly after the page loads on fast connections.

---

### 3.3 Existing user — change plan

Accessed from `/settings/billing` → plan selector.

**Upgrading / switching between paid plans:**

```
PlanUpgradeCard → form → changePlanAction
  → findActiveSubscriptionByWorkspaceId
  → stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'create_prorations'
    })
  → updateSubscription(planId, stripePriceId, billingInterval)
  → revalidatePath('/settings/billing')
```

Proration is handled automatically by Stripe. No new checkout session needed.

**Downgrading to free (STANDARD):**

```
changePlanAction
  → stripe.subscriptions.cancel(stripeSubscriptionId)
  → createSubscription(status: ACTIVE, billingInterval: MONTHLY)  ← new free record
  → revalidatePath('/settings/billing')
```

**No current subscription → paid plan:**

```
changePlanAction
  → create Stripe Customer if needed
  → stripe.checkout.sessions.create(...)
  → redirect(session.url)  ← new hosted checkout
```

---

### 3.4 Existing user — cancel subscription

```
PlanUpgradeCard "Cancel plan" button → cancelSubscriptionAction
  → stripe.subscriptions.update(id, { cancel_at_period_end: true })
  → cancelSubscription(subscriptionId, cancelAtPeriodEnd: true)
    → DB: status stays ACTIVE, cancelAtPeriodEnd = true
  → revalidatePath('/settings/billing')
```

User keeps full access until `currentPeriodEndAt`.
When the period ends, Stripe fires `customer.subscription.deleted` →
webhook sets `status: CANCELLED`.

To **undo** cancellation before period end: update Stripe subscription with
`cancel_at_period_end: false` (not yet implemented in UI — use Stripe portal).

---

### 3.5 Existing user — manage payment method

```
ManageBillingButton (client component)
  → POST /api/stripe/portal
  → stripe.billingPortal.sessions.create({ customer: stripeCustomerId })
  → returns { url }
  → window.location.href = url  ← redirect to Stripe-hosted portal
  → return_url: /settings/billing
```

The portal allows: update card, view invoices, download receipts, manage subscriptions.

---

## 4. Stripe integration

### 4.1 Checkout session

**Route:** `POST /api/stripe/checkout`

**Request body:**

```json
{
  "workspaceId": "clx...",
  "planId": "clx...",
  "billingInterval": "MONTHLY" | "YEARLY"
}
```

**What it does:**

1. Verifies Clerk auth — workspace must belong to caller
2. Resolves `stripePriceId` from `plan.stripePriceIdMonthly` or `plan.stripePriceIdYearly`
3. Creates Stripe Customer if `workspace.stripeCustomerId` is null, saves ID to DB
4. Creates `stripe.checkout.sessions` with:
   - `mode: 'subscription'`
   - `success_url`: `/dashboard?subscription=success`
   - `cancel_url`: `/onboarding`
   - `metadata`: `{ workspaceId, planId, billingInterval }` — used by webhook
5. Returns `{ url: session.url }`

Also called indirectly from `selectPlanAction` (server action, same logic inline).

---

### 4.2 Billing portal

**Route:** `POST /api/stripe/portal`

Requires `workspace.stripeCustomerId` to exist (i.e. user has had at least one paid
checkout). Returns `{ url }` pointing to Stripe-hosted portal with
`return_url: /settings/billing`.

---

### 4.3 Webhook events

**Route:** `POST /api/stripe/webhooks`

Excluded from Clerk middleware — Stripe sends unsigned requests.
Signature verified via `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`.

| Event                           | Handler                         | Effect                                              |
| ------------------------------- | ------------------------------- | --------------------------------------------------- |
| `checkout.session.completed`    | `handleCheckoutCompleted`       | Creates `WorkspaceSubscription` record (idempotent) |
| `customer.subscription.updated` | `handleSubscriptionUpdated`     | Updates status, price, period, cancelAtPeriodEnd    |
| `customer.subscription.deleted` | `handleSubscriptionDeleted`     | Sets status → `CANCELLED`                           |
| `invoice.payment_succeeded`     | `handleInvoicePaymentSucceeded` | Sets status → `ACTIVE`                              |
| `invoice.payment_failed`        | `handleInvoicePaymentFailed`    | Sets status → `PAST_DUE`                            |

**Stripe v22 API notes:**

- `current_period_start` / `current_period_end` are on `SubscriptionItem`, not `Subscription`
  → read from `subscription.items.data[0].current_period_start`
- Invoice subscription ID is via `invoice.parent.subscription_details.subscription`
  (not the legacy `invoice.subscription` field)

**Idempotency:** `handleCheckoutCompleted` checks `findSubscriptionByStripeId` first —
safe to receive the same event multiple times.

---

## 5. Feature enforcement

**File:** `src/features/commercial/lib/feature-limits.ts`

### How limits are resolved

```
getEffectiveLimits(workspaceId)
  │
  ├─ findActiveSubscriptionByWorkspaceId
  │    └─ status IN [ACTIVE, TRIALING, PAST_DUE]
  │    └─ includes plan.features.feature
  │
  ├─ if no subscription → fallback to STANDARD plan limits
  │
  ├─ load WorkspaceFeature overrides (non-expired)
  │
  └─ for each FeatureCode:
       WorkspaceFeature.limitOverride  ← highest priority (admin override)
         ?? PlanFeature.limitValue     ← plan default
         null = unlimited
         0    = disabled
```

### `checkFeatureAllowed`

```ts
const check = await checkFeatureAllowed({
  workspaceId,
  featureCode: 'MAX_DOMAINS',
  currentCount: existingDomainCount,
})

if (!check.allowed) {
  throw new Error(
    `Domain limit reached. Your plan allows up to ${check.limit} domains.`,
  )
}
```

### Current enforcement points

| Repository function                     | Feature code checked |
| --------------------------------------- | -------------------- |
| `createDomain` (`domain-repository.ts`) | `MAX_DOMAINS`        |
| `createLead` (`lead-repository.ts`)     | `MAX_CONTACTS`       |

`MAX_EMAILS_PER_MONTH` is reserved — enforce it in the email send action when
that feature is implemented.

### WorkspaceFeature overrides (admin use)

Insert a row directly into `WorkspaceFeature` to override any limit for a specific
workspace:

```sql
INSERT INTO "WorkspaceFeature" (id, "workspaceId", "featureId", "isEnabled", "limitOverride", "expiresAt", ...)
VALUES (gen_random_uuid(), '<workspaceId>', '<featureId>', true, 999, NULL, now(), now());
```

`expiresAt: null` = permanent override. Set a date to make it time-limited (e.g. trial extension).

---

## 6. File map

```
src/
├── shared/
│   └── lib/
│       ├── stripe.ts                          Stripe SDK singleton (server-only)
│       └── stripe-client.ts                   Stripe SDK singleton (client-only)
│
├── features/
│   ├── commercial/
│   │   ├── lib/
│   │   │   └── feature-limits.ts              getEffectiveLimits, checkFeatureAllowed
│   │   └── repositories/
│   │       ├── subscription-repository.ts     CRUD for WorkspaceSubscription
│   │       ├── workspace-repository.ts        + updateWorkspaceStripeCustomerId
│   │       └── index.ts                       barrel re-exports
│   │
│   ├── home/
│   │   └── repositories/
│   │       └── plan-repository.ts             listActivePlans, findPlanByCode, findPlanById
│   │
│   ├── onboarding/
│   │   ├── actions/
│   │   │   ├── create-workspace-action.ts     returns { workspaceId } (no redirect)
│   │   │   └── select-plan-action.ts          free → DB subscription; paid → Stripe checkout
│   │   ├── components/
│   │   │   ├── onboarding-page.tsx            3-step orchestrator
│   │   │   ├── onboarding-step-plan.tsx       plan selector UI (step 3)
│   │   │   └── onboarding-step-workspace.tsx  + onSuccess(workspaceId) callback
│   │   └── lib/
│   │       └── onboarding-stepper.ts          profile | workspace | plan
│   │
│   └── billing/
│       ├── actions/
│       │   ├── change-plan-action.ts          upgrade, downgrade, new checkout
│       │   └── cancel-subscription-action.ts  cancelAtPeriodEnd via Stripe
│       └── components/
│           ├── billing-page.tsx               server component — data fetching
│           ├── current-plan-card.tsx          displays active subscription info
│           ├── plan-upgrade-card.tsx          plan switcher + cancel UI
│           └── manage-billing-button.tsx      client — POST /api/stripe/portal
│
└── app/
    ├── api/stripe/
    │   ├── checkout/route.ts                  POST — create checkout session
    │   ├── portal/route.ts                    POST — create portal session
    │   └── webhooks/route.ts                  POST — Stripe event handler
    ├── onboarding/page.tsx                    fetches plans, renders OnboardingPage
    └── (app)/settings/
        ├── page.tsx                           settings index → link to /settings/billing
        └── billing/page.tsx                   renders BillingPage
```

---

## 7. Environment variables

| Variable                | Required | Description                                                                 |
| ----------------------- | -------- | --------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`     | Yes      | `sk_test_...` or `sk_live_...` from Stripe dashboard                        |
| `STRIPE_WEBHOOK_SECRET` | Yes      | `whsec_...` from Stripe CLI or webhook endpoint                             |
| `NEXT_PUBLIC_APP_URL`   | Yes      | Base URL used for success/cancel/return URLs (e.g. `http://localhost:3000`) |

All three are validated at startup via `src/env.ts` (`@t3-oss/env-nextjs`).
If any are missing or malformed the app will throw on boot, not at request time.

---

## 8. Local development setup

### Prerequisites

- Stripe CLI installed: `winget install Stripe.StripeCLI`
- `.env.local` with `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_APP_URL`

### Steps

**Terminal 1 — webhook forwarding:**

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhooks
# Copy the printed whsec_... into .env.local as STRIPE_WEBHOOK_SECRET
```

**Terminal 2 — Next.js:**

```bash
bun dev
```

### Connect plans to Stripe prices

1. Go to **Stripe dashboard → Product catalog → Add product**
2. Create **Plus** with two prices: `$67/month` and `$670/year`
3. Create **Ultimate** with two prices: `$97/month` and `$970/year`
4. Copy the `price_...` IDs and write them to the DB:

```bash
bun prisma studio
# Table: Plan → PLUS row → set stripePriceIdMonthly + stripePriceIdYearly
# Table: Plan → ULTIMATE row → set the same
```

Or via SQL:

```sql
UPDATE "Plan"
SET "stripePriceIdMonthly" = 'price_xxx', "stripePriceIdYearly" = 'price_yyy'
WHERE code = 'PLUS';

UPDATE "Plan"
SET "stripePriceIdMonthly" = 'price_aaa', "stripePriceIdYearly" = 'price_bbb'
WHERE code = 'ULTIMATE';
```

### Test card

```
Number:  4242 4242 4242 4242
Expiry:  any future date
CVC:     any 3 digits
```

---

## 9. Adding a new feature gate

1. **Add to seed** (`prisma/seed.ts`):

```ts
const features = [
  // ...existing
  {
    code: 'MAX_CHATBOTS',
    name: 'Chatbots',
    description: 'Maximum chatbots per workspace.',
  },
]
```

2. **Add limits to each plan** in `plans` array:

```ts
{ code: 'MAX_CHATBOTS', isEnabled: true, limitValue: 1 },   // STANDARD
{ code: 'MAX_CHATBOTS', isEnabled: true, limitValue: 5 },   // PLUS
{ code: 'MAX_CHATBOTS', isEnabled: true },                  // ULTIMATE (unlimited)
```

3. **Run seed:** `bun prisma db seed`

4. **Add to FeatureCode union** (`feature-limits.ts`):

```ts
export type FeatureCode =
  | 'MAX_DOMAINS'
  | 'MAX_CONTACTS'
  | 'MAX_EMAILS_PER_MONTH'
  | 'MAX_CHATBOTS' // ← add here
```

5. **Add to `getEffectiveLimits` return type:**

```ts
return {
  // ...existing
  MAX_CHATBOTS: resolveLimit('MAX_CHATBOTS'),
}
```

6. **Enforce in the relevant repository / server action:**

```ts
const count = await prisma.chatbot.count({ where: { workspaceId } })
const check = await checkFeatureAllowed({
  workspaceId,
  featureCode: 'MAX_CHATBOTS',
  currentCount: count,
})
if (!check.allowed) throw new Error(`Chatbot limit reached (${check.limit}).`)
```

---

## 10. Adding a new plan

1. **Add to seed** (`prisma/seed.ts`):

```ts
{
  code: 'ENTERPRISE',
  name: 'Enterprise',
  description: 'Custom limits for large teams.',
  monthlyPriceCents: 29700,
  yearlyPriceCents: 297000,
  features: [
    { code: 'MAX_DOMAINS',           isEnabled: true },          // unlimited
    { code: 'MAX_CONTACTS',          isEnabled: true },          // unlimited
    { code: 'MAX_EMAILS_PER_MONTH',  isEnabled: true },          // unlimited
  ],
}
```

2. **Run seed:** `bun prisma db seed`

3. **Create Stripe products and prices** for the new plan (see §8).

4. **Write price IDs to DB** via Prisma Studio or SQL.

The new plan automatically appears in the landing page pricing section
(`listActivePlans`) and in the onboarding/billing plan selectors.
