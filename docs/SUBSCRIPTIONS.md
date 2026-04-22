# Subscriptions, Plans & Feature Limits

> End-to-end reference for how Sendora handles plan tiers, Stripe billing, and feature enforcement.

---

## Table of Contents

1. [Data model](#1-data-model)
2. [Plans & features seed](#2-plans--features-seed)
3. [User flows](#3-user-flows)
   - [New user — free plan](#31-new-user--free-plan)
   - [New user — paid plan](#32-new-user--paid-plan)
   - [Existing user — upgrade](#33-existing-user--upgrade)
   - [Existing user — downgrade (scheduled)](#34-existing-user--downgrade-scheduled)
   - [Existing user — cancel pending downgrade](#35-existing-user--cancel-pending-downgrade)
   - [Existing user — cancel subscription](#36-existing-user--cancel-subscription)
   - [Existing user — downgrade to free](#37-existing-user--downgrade-to-free)
   - [Existing user — manage payment method](#38-existing-user--manage-payment-method)
4. [Stripe integration](#4-stripe-integration)
   - [Checkout session](#41-checkout-session)
   - [Subscription schedules (downgrades)](#42-subscription-schedules-downgrades)
   - [Billing portal](#43-billing-portal)
   - [Webhook events](#44-webhook-events)
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

### `WorkspaceSubscription` fields

| Field                    | Type               | Purpose                                                                               |
| ------------------------ | ------------------ | ------------------------------------------------------------------------------------- |
| `planId`                 | `String`           | Active plan (foreign key to `Plan`)                                                   |
| `billingInterval`        | `BillingInterval`  | `MONTHLY` or `YEARLY`                                                                 |
| `status`                 | enum               | `TRIALING` / `ACTIVE` / `PAST_DUE` / `CANCELLED` / `EXPIRED`                          |
| `stripeSubscriptionId`   | `String? @unique`  | Stripe subscription ID (`sub_...`); null for free plan                                |
| `stripePriceId`          | `String?`          | Currently active Stripe price ID                                                      |
| `currentPeriodStartAt`   | `DateTime?`        | Start of the current billing period                                                   |
| `currentPeriodEndAt`     | `DateTime?`        | End of the current billing period (next renewal / cancellation date)                  |
| `cancelAtPeriodEnd`      | `Boolean`          | User requested cancellation; subscription ends at `currentPeriodEndAt`                |
| `pendingPlanId`          | `String?`          | Plan that will become active at period end (scheduled downgrade)                      |
| `pendingBillingInterval` | `BillingInterval?` | Billing interval for the pending plan                                                 |
| `pendingStripePriceId`   | `String?`          | Stripe price ID for the pending plan — used by the webhook to detect phase transition |
| `stripeScheduleId`       | `String? @unique`  | Stripe Subscription Schedule ID (`sub_sched_...`); set during downgrade               |

> **Pending fields** (`pendingPlanId`, `pendingBillingInterval`, `pendingStripePriceId`, `stripeScheduleId`) are populated only while a scheduled downgrade is active. They are cleared by the webhook once the transition completes, or by the "Cancel scheduled change" action.

### `WorkspaceSubscription` status lifecycle

```
(checkout created)
       │
       ▼
  TRIALING ──► ACTIVE ──► PAST_DUE ──► CANCELLED
                 │                          ▲
                 ├──── cancelAtPeriodEnd ───┘
                 │     (stays ACTIVE until period end,
                 │      then Stripe fires `deleted`)
                 │
                 └──── pendingPlanId set
                       (stays ACTIVE on current plan,
                        Stripe schedule transitions at period end)
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

### 3.3 Existing user — upgrade

An **upgrade** is switching to a plan with a higher `monthlyPriceCents`.

```
PlanUpgradeCard → form → changePlanAction
  → compare newPlan.monthlyPriceCents > currentSubscription.plan.monthlyPriceCents
  → isUpgrade = true

  → if stripeScheduleId exists: stripe.subscriptionSchedules.release(stripeScheduleId)
    (clears any previously scheduled downgrade before applying the upgrade)

  → stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'always_invoice'   ← key: immediate invoice & charge
    })

  → updateSubscription({
      planId, stripePriceId, billingInterval,
      pendingPlanId: null, pendingBillingInterval: null,
      pendingStripePriceId: null, stripeScheduleId: null
    })

  → revalidatePath('/settings/billing')
```

`always_invoice` causes Stripe to **immediately** generate and charge an invoice for the
prorated difference. This prevents the "upgrade → use → downgrade before invoice" abuse pattern.

---

### 3.4 Existing user — downgrade (scheduled)

A **downgrade** is switching to a plan with a lower `monthlyPriceCents`.

```
PlanUpgradeCard → form → changePlanAction
  → compare newPlan.monthlyPriceCents < currentSubscription.plan.monthlyPriceCents
  → isUpgrade = false

  → stripe.subscriptions.retrieve(stripeSubscriptionId)
      currentItem = subscription.items.data[0]
      currentPriceId      = currentItem.price.id
      currentPeriodStart  = currentItem.current_period_start  (Unix timestamp)
      currentPeriodEnd    = currentItem.current_period_end    (Unix timestamp)

  → resolve scheduleId:
      if subscription.schedule exists → reuse existing schedule
      else → stripe.subscriptionSchedules.create({ from_subscription: stripeSubscriptionId })

  → stripe.subscriptionSchedules.update(scheduleId, {
      end_behavior: 'release',
      phases: [
        {
          start_date: currentPeriodStart,   ← anchors end_date calculation (required by Stripe)
          items: [{ price: currentPriceId }],
          end_date: currentPeriodEnd,       ← keep current plan until billing period ends
        },
        {
          items: [{ price: newPriceId }],   ← new plan starts automatically at period end
        }
      ]
    })

  → updateSubscription({
      pendingPlanId, pendingBillingInterval,
      pendingStripePriceId: newPriceId,     ← used by webhook to detect phase transition
      stripeScheduleId                      ← stored for potential cancellation
      // planId is NOT changed yet
    })

  → revalidatePath('/settings/billing')
```

**What the user sees:** `CurrentPlanCard` shows a "Scheduled change" banner:

```
⏱  Scheduled change
   Ultimate → Plus
   Your plan will switch to Plus on January 31, 2026.
   You keep full access to your current plan until then.
```

`PlanUpgradeCard` shows the pending plan button disabled with label **"Scheduled"** and a
**"Cancel scheduled change"** button below the plan grid.

**What happens at period end:**
Stripe executes phase 2 of the schedule and fires `customer.subscription.updated` with the
new price. The webhook detects `newPriceId === existing.pendingStripePriceId` and promotes
the pending fields to active (see §4.4).

---

### 3.5 Existing user — cancel pending downgrade

```
PlanUpgradeCard "Cancel scheduled change" → cancelPendingDowngradeAction
  → stripe.subscriptionSchedules.release(stripeScheduleId)
    (Stripe detaches the schedule; subscription continues on current plan indefinitely)

  → updateSubscription({
      pendingPlanId: null,
      pendingBillingInterval: null,
      pendingStripePriceId: null,
      stripeScheduleId: null
    })

  → revalidatePath('/settings/billing')
```

After this, the subscription behaves as if no downgrade was ever requested.

---

### 3.6 Existing user — cancel subscription

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

> **Note:** The "Cancel plan" button is hidden when a scheduled downgrade is active
> (`pendingPlanId` is set). The user must first cancel the scheduled change or let it
> complete before they can cancel the subscription entirely.

---

### 3.7 Existing user — downgrade to free

Downgrading to the STANDARD plan (free) is a special case — no schedule is used because
a free plan has no Stripe subscription.

```
changePlanAction detects plan.monthlyPriceCents === 0

  → if stripeScheduleId exists: stripe.subscriptionSchedules.release(stripeScheduleId)
  → stripe.subscriptions.cancel(stripeSubscriptionId)   ← immediate cancellation
  → createSubscription(status: ACTIVE, billingInterval: MONTHLY)  ← new free DB record
  → revalidatePath('/settings/billing')
```

---

### 3.8 Existing user — manage payment method

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

### 4.2 Subscription schedules (downgrades)

Downgrades use Stripe **Subscription Schedules** to apply the plan change at the end of the
current billing period rather than immediately.

**Why schedules and not immediate updates?**

| Approach                      | Behaviour                                                   | Problem                                                                   |
| ----------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| Immediate switch              | Plan changes now, Stripe issues proration credit            | User loses remaining paid time on higher plan; UX feels punishing         |
| `create_prorations`           | Proration accumulates on next invoice                       | Abuse: upgrade → use → downgrade before invoice → near-zero net charge    |
| `always_invoice` on downgrade | Immediate credit                                            | Good for upgrades; for downgrades user loses access they already paid for |
| **Subscription schedule**     | Phase 1 = current plan until period end; Phase 2 = new plan | ✅ User keeps what they paid for; no abuse possible                       |

**Schedule lifecycle:**

```
downgrade requested
       │
       ▼
stripe.subscriptionSchedules.create({ from_subscription })
stripe.subscriptionSchedules.update(scheduleId, { phases: [phase1, phase2] })
       │
       ▼
Phase 1: current plan runs until currentPeriodEnd
       │
       ▼ (Stripe fires customer.subscription.updated)
Phase 2: new plan activates
       │
       ▼
webhook promotes pendingPlanId → planId, clears pending fields
schedule released (end_behavior: 'release')
```

**Key implementation note:** `start_date` on phase 1 is **required** — Stripe needs at least
one anchored phase to calculate relative `end_date` values. Set it to
`currentItem.current_period_start` (Unix timestamp from the subscription item).

---

### 4.3 Billing portal

**Route:** `POST /api/stripe/portal`

Requires `workspace.stripeCustomerId` to exist (i.e. user has had at least one paid
checkout). Returns `{ url }` pointing to Stripe-hosted portal with
`return_url: /settings/billing`.

---

### 4.4 Webhook events

**Route:** `POST /api/stripe/webhooks`

Excluded from Clerk middleware — Stripe sends unsigned requests.
Signature verified via `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`.

| Event                           | Handler                         | Effect                                                                                 |
| ------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| `checkout.session.completed`    | `handleCheckoutCompleted`       | Creates `WorkspaceSubscription` record (idempotent)                                    |
| `customer.subscription.updated` | `handleSubscriptionUpdated`     | Updates status, price, period, cancelAtPeriodEnd — **or promotes scheduled downgrade** |
| `customer.subscription.deleted` | `handleSubscriptionDeleted`     | Sets status → `CANCELLED`                                                              |
| `invoice.payment_succeeded`     | `handleInvoicePaymentSucceeded` | Sets status → `ACTIVE`                                                                 |
| `invoice.payment_failed`        | `handleInvoicePaymentFailed`    | Sets status → `PAST_DUE`                                                               |

**Scheduled downgrade detection in `handleSubscriptionUpdated`:**

```ts
const newPriceId = subscription.items.data[0]?.price.id

// Phase transition completed — promote pending plan to active
if (existing.pendingStripePriceId && newPriceId === existing.pendingStripePriceId) {
  await updateSubscription({
    subscriptionId: existing.id,
    planId: existing.pendingPlanId,
    billingInterval: existing.pendingBillingInterval,
    stripePriceId: newPriceId,
    status: mapStripeStatus(subscription.status),
    currentPeriodStartAt,
    currentPeriodEndAt,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    // clear all pending fields
    pendingPlanId: null,
    pendingBillingInterval: null,
    pendingStripePriceId: null,
    stripeScheduleId: null,
  })
  return
}

// Otherwise: regular status / period update
await updateSubscription({ subscriptionId: existing.id, status, ... })
```

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

> **Important:** Limits are always enforced against the **active** plan (`planId`), not the
> pending plan. A user with a scheduled downgrade to Plus continues to enjoy Ultimate limits
> until the period ends and the webhook promotes the pending plan.

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

### Pre-action limit check (UI layer)

For a better UX, limits are also checked **before** the user attempts an action.
Example: the "Add domain" button in the sidebar passes `canAddDomain` and `domainLimit`
from the server layout, so the dialog shows an upgrade prompt instead of an error when
the limit is already reached.

```ts
// src/app/(app)/layout.tsx
const [domains, limits] = await Promise.all([
  listDomainsByWorkspace({ workspaceId: workspace.id }),
  getEffectiveLimits(workspace.id),
])

const domainLimit = limits.MAX_DOMAINS
const canAddDomain = domainLimit === null || domains.length < domainLimit
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
│       ├── stripe.ts                              Stripe SDK singleton (server-only)
│       └── stripe-client.ts                       Stripe SDK singleton (client-only)
│
├── features/
│   ├── commercial/
│   │   ├── lib/
│   │   │   └── feature-limits.ts                  getEffectiveLimits, checkFeatureAllowed
│   │   └── repositories/
│   │       ├── domain-repository.ts               CRUD for Domain (+ findDomainById, updateDomain)
│   │       ├── subscription-repository.ts         CRUD for WorkspaceSubscription
│   │       ├── workspace-repository.ts            + updateWorkspaceStripeCustomerId
│   │       └── index.ts                           barrel re-exports
│   │
│   ├── home/
│   │   └── repositories/
│   │       └── plan-repository.ts                 listActivePlans, findPlanByCode, findPlanById
│   │
│   ├── onboarding/
│   │   ├── actions/
│   │   │   ├── create-workspace-action.ts         returns { workspaceId } (no redirect)
│   │   │   └── select-plan-action.ts              free → DB subscription; paid → Stripe checkout
│   │   ├── components/
│   │   │   ├── onboarding-page.tsx                3-step orchestrator
│   │   │   ├── onboarding-step-plan.tsx           plan selector UI (step 3)
│   │   │   └── onboarding-step-workspace.tsx      + onSuccess(workspaceId) callback
│   │   └── lib/
│   │       └── onboarding-stepper.ts              profile | workspace | plan
│   │
│   ├── domains/
│   │   ├── schemas.ts                             createDomainSchema, updateDomainSchema
│   │   ├── actions/
│   │   │   ├── create-domain-action.ts            validates → createDomain → redirect to domain page
│   │   │   ├── update-domain-action.ts            validates → updateDomain → revalidate
│   │   │   └── delete-domain-action.ts            deleteDomain → redirect to /dashboard
│   │   └── components/
│   │       ├── add-domain-dialog.tsx              sidebar + icon; shows upgrade prompt if limit reached
│   │       ├── domain-page.tsx                    RSC page assembler (header + settings + integration)
│   │       ├── domain-settings-form.tsx           hostname + icon upload (Uploadcare, max 2MB)
│   │       ├── domain-chatbot-integration.tsx     iframe snippet placeholder (Coming soon)
│   │       └── delete-domain-button.tsx           AlertDialog confirmation → deleteDomainAction
│   │
│   └── billing/
│       ├── actions/
│       │   ├── change-plan-action.ts              upgrade (always_invoice) or downgrade (schedule)
│       │   ├── cancel-subscription-action.ts      cancelAtPeriodEnd via Stripe
│       │   └── cancel-pending-downgrade-action.ts release Stripe schedule + clear pending DB fields
│       └── components/
│           ├── billing-page.tsx                   server component — data fetching
│           ├── current-plan-card.tsx              active plan info + scheduled change banner
│           ├── plan-upgrade-card.tsx              plan grid + Scheduled button + cancel change UI
│           └── manage-billing-button.tsx          client — POST /api/stripe/portal
│
└── app/
    ├── api/stripe/
    │   ├── checkout/route.ts                      POST — create checkout session
    │   ├── portal/route.ts                        POST — create portal session
    │   └── webhooks/route.ts                      POST — Stripe event handler
    ├── onboarding/page.tsx                        fetches plans, renders OnboardingPage
    └── (app)/
        ├── layout.tsx                             fetches domains + effective limits → canAddDomain
        ├── domains/[domainId]/page.tsx            domain detail page (RSC)
        └── settings/
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

### Testing upgrade / downgrade flows

**Upgrade abuse prevention:**

1. Subscribe to Plus
2. Upgrade to Ultimate → Stripe immediately generates and charges a prorated invoice
3. In Stripe dashboard → Invoices: confirm a paid invoice for the prorated difference
4. Downgrade back to Plus → a Stripe schedule is created; `pendingPlanId` is set in DB
5. Confirm the UI shows "Scheduled change: Ultimate → Plus on [date]"

**Scheduled downgrade with Stripe test clock:**

1. Subscribe to Ultimate
2. Downgrade to Plus → confirm `pendingPlanId` + `stripeScheduleId` are set in DB
3. In Stripe dashboard → Test clocks: advance time past `currentPeriodEndAt`
4. Stripe fires `customer.subscription.updated` with the Plus price ID
5. Webhook promotes pending fields → confirm `planId = Plus`, pending fields cleared

**Cancel pending downgrade:**

1. As above, before advancing the test clock
2. Click "Cancel scheduled change" in the UI
3. Confirm `stripeScheduleId` is cleared in DB and Stripe schedule shows "Released"

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

7. **(Optional) Pre-check in UI** — fetch `getEffectiveLimits` in the server component and
   pass `canAdd` + `limit` as props to the client dialog (see `AddDomainDialog` as a
   reference implementation).

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
