# Sendora Product Roadmap

> Framework: **Now / Next / Later**
> Last updated: April 15, 2026
> Based on: post-MVP brainstorm session

---

## Shipped (MVP v1.0.0 — April 8, 2026)

| Feature                     | Description                                                                        | Status   |
| --------------------------- | ---------------------------------------------------------------------------------- | -------- |
| Authentication & Onboarding | Clerk-based auth, OTP, 3-step onboarding (Profile → Workspace → Plan)              | **Done** |
| Workspace & Domains         | Domain creation, icon upload (Uploadcare), domain verification via meta tag        | **Done** |
| Billing & Subscriptions     | Stripe checkout, customer portal, upgrades/downgrades/cancellation, webhooks       | **Done** |
| Feature Gating              | Plan-based limits: MAX_DOMAINS, MAX_CONTACTS, MAX_EMAILS_PER_MONTH                 | **Done** |
| AI Chatbot                  | OpenAI-powered widget, script-based embed, auto-sync styles, chatbot customization | **Done** |
| Real-time Human Handoff     | AI → human escalation via Pusher, operator message input                           | **Done** |
| Conversations Dashboard     | Operator inbox with session list, filters, real-time updates, portal link sending  | **Done** |
| Appointment Booking         | Weekly availability config, slot generation, portal booking flow (3-step wizard)   | **Done** |
| Lead Auto-capture           | Leads created automatically on chatbot interaction and booking (DB layer only)     | **Done** |
| White-label Branding        | "Powered by Sendora" hidden on paid plans                                          | **Done** |
| Landing Page                | Hero, features, pricing, testimonials, FAQ, CTA, footer                            | **Done** |

---

## Now — Active

### 1. Lead Management UI

**Why:** Leads are captured automatically but invisible to operators. Paying customers ($67-97/mo) have no way to see their pipeline or measure chatbot ROI. This is the biggest gap between conversion and perceived value.

**Scope:**

- `/leads` page — filterable table of all captured leads (name, email, domain source, status, date)
- Lead status management: NEW → CONTACTED → QUALIFIED → WON / LOST
- Lead detail drawer/page: full conversation history, booking history, notes field
- Filter by domain, status, date range

**Dependencies:** Lead model already exists in DB (status, score, notes, metadata fields)

---

### 2. Main Dashboard Analytics

**Why:** Currently `/dashboard` is an empty welcome page. Without metrics, users cannot prove ROI and have no feedback loop to improve their chatbot. This directly impacts retention.

**Scope:**

- Summary cards: new leads (7d / 30d), open sessions, upcoming bookings, lead conversion rate
- Sessions → Leads conversion funnel (per domain)
- Leads by status (chart)
- Upcoming bookings list (next 7 days)
- Most active domains

**Dependencies:** Leads UI (shared data), existing Booking and ChatSession models

---

### 3. Booking Email Notifications

**Why:** Basic hygiene that every competitor has. A customer books an appointment — neither the customer nor the operator gets an email confirmation. This creates no-shows and erodes trust.

**Scope:**

- Customer confirmation email on booking (name, date/time, timezone, operator contact)
- Operator notification email on new booking
- Reminder email 24h before appointment (customer)
- Use existing Nodemailer setup; migrate to Resend for reliability

**Dependencies:** AppointmentSchedule + Booking models (done), email infrastructure

---

### 4. Booking Status Management UI

**Why:** The Booking model has PENDING / CONFIRMED / COMPLETED / CANCELLED / NO_SHOW statuses but there is no UI to change them in `/appointments`. Operators currently cannot confirm or complete a booking.

**Scope:**

- Status change controls in the appointments list and calendar view
- Confirmation modal for destructive actions (cancel, no-show)
- Status-based visual indicators (color-coded badges, calendar highlights)

**Dependencies:** Appointments UI (done), Booking model (done)

---

## Later — Directional

These are strategic bets. Scope and timing are flexible. Do not start until Now and Next are stable.

| Initiative             | Description                                                                               | Notes                         |
| ---------------------- | ----------------------------------------------------------------------------------------- | ----------------------------- |
| In-Chat Payments       | Stripe Payment Intent inside chatbot, payment link generation, lead-linked payment record | Enables Financial Dashboard   |
| FAQ Module             | Per-domain FAQ builder, embed in widget, AI knowledge base integration                    | Listed in MVP.md, deferred    |
| Integrations Hub       | Google Calendar sync, HubSpot/Salesforce lead export, Zapier webhooks                     | Post-MVP scope                |
| Advanced Analytics     | Conversion funnels, email open/click rates, A/B testing, CSV export                       | After email marketing is live |
| White-Label Deep       | Custom chatbot domains, custom sender name, full workspace theming                        | Ultimate plan only            |
| Admin Panel (Internal) | Workspace overrides, usage monitoring, support access mode                                | Internal tooling              |
| Mobile Apps            | Native iOS/Android                                                                        | Explicitly out of MVP scope   |
| Multi-language AI      | Localized chatbot responses                                                               | Out of MVP scope              |
| CRM Integrations       | HubSpot, Salesforce deep sync                                                             | Out of MVP scope              |

---

## Dependencies Map

```
Shipped MVP
  └── Lead Management UI  ←── NOW
        └── Dashboard Analytics  ←── NOW (parallel)
        └── Email Marketing MVP  ←── NEXT (after leads UI)
              └── Advanced Analytics  ←── LATER
  └── Booking Notifications  ←── NOW
        └── Booking Status UI  ←── NEXT
  └── In-Chat Payments  ←── LATER
        └── Financial Dashboard  ←── LATER
```

---

## Risks

| Risk                                                 | Likelihood | Impact | Mitigation                                                     |
| ---------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------- |
| Email deliverability issues with Nodemailer at scale | High       | High   | Switch to Resend/SendGrid before Email Marketing launch        |
| Email Marketing built without demand validation      | Medium     | High   | Talk to 5 customers before scoping sprint                      |
| Lead Management scope expands (CRM-like features)    | Medium     | Medium | Strictly limit v1 to table + status + notes — no custom fields |
| Booking notifications land in spam                   | Medium     | Medium | Use Resend with proper SPF/DKIM setup                          |
