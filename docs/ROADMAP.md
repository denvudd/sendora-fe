# Sendora Product Roadmap

> Framework: **Now / Next / Later**
> Last updated: April 2026

---

## Implemented (Done)

Features already shipped and live in the codebase.

| Feature                     | Description                                                                                   | Status   |
| --------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| Authentication & Onboarding | Clerk-based auth, OTP, 3-step onboarding (Profile → Workspace → Plan)                         | **Done** |
| Workspace Creation          | Workspace setup with name, logo, and white-label config                                       | **Done** |
| Billing & Subscriptions     | Stripe checkout, customer portal, webhooks, plan upgrades/downgrades, trial support           | **Done** |
| Domains CRUD                | Create, edit, delete domains with icon upload (Uploadcare)                                    | **Done** |
| Feature Gating              | Plan-based limits: MAX_DOMAINS, MAX_CONTACTS, MAX_EMAILS_PER_MONTH; workspace-level overrides | **Done** |
| App Layout & Navigation     | Sidebar with domain switcher, user profile, navigation links                                  | **Done** |
| Dashboard Shell             | Basic dashboard page structure                                                                | **Done** |
| Landing Page                | Hero, features, pricing, testimonials, FAQ, CTA, footer                                       | **Done** |

---

## Phase 1

Core product viability: the features needed to deliver actual value to end users.

### Chatbot Integration

**Goal:** Deploy an AI sales representative on any customer website.

- Connect OpenAI API to domain configuration
- Build embeddable chatbot widget served via `<iframe>` snippet
- Domain settings: chatbot name, greeting message, colors, logo, CTAs
- Chatbot preview within the domain settings UI
- Public chatbot endpoint (`/chatbot/[domainId]`)

**Dependencies:** Domain model (done), OpenAI SDK (configured), Uploadcare (done)
**Plan gate:** All plans (limited by MAX_DOMAINS)

---

### Lead Capture

**Goal:** Automatically track and store visitors who interact with the chatbot.

- Visitor session tracking (anonymous → identified)
- Lead creation on first interaction
- Lead profile: name, email, phone, interaction history
- Leads list view with search and filters
- Lead detail page with full conversation history

**Dependencies:** Chatbot Integration, Lead model (in Prisma schema)
**Plan gate:** MAX_CONTACTS per plan

---

### Conversations Inbox

**Goal:** Allow operators to take over conversations from the AI in real time.

- Real-time conversation list (Pusher)
- Message thread UI per lead
- Manual takeover mode (disable AI, enable human reply)
- Read/unread status, conversation close action
- Notification badge in sidebar

**Dependencies:** Lead Capture, Pusher (configured)

---

## Phase 2

Revenue-generating features that complete the core sales loop.

### Appointments

**Goal:** Let leads book meetings directly within the chatbot.

- Calendar availability configuration per domain
- In-chat booking widget (date/time picker)
- Booking confirmation email (Nodemailer)
- Bookings list view in the app (`/appointments`)
- Booking model already in Prisma schema

**Dependencies:** Chatbot Integration, Nodemailer (configured)

---

### In-Chat Payments

**Goal:** Accept payments from leads without leaving the conversation.

- Stripe Payment Intent creation from chatbot
- Payment link generation and embedding in chat
- Payment confirmation flow
- Payment record linked to lead
- Payment model already in Prisma schema

**Dependencies:** Chatbot Integration, Stripe (done)
**Plan gate:** Plus and Ultimate plans

---

### Email Marketing MVP

**Goal:** Nurture leads with automated and manual email campaigns.

- Campaign builder: name, subject, body (rich text editor)
- Audience selection: all leads, filtered segment, or manual list
- Send now or schedule for later
- Triggered emails: welcome sequence, post-booking follow-up
- Email send history and basic delivery tracking
- Nodemailer integration for sends
- Enforce MAX_EMAILS_PER_MONTH plan limit

**Dependencies:** Lead Capture, Nodemailer (configured)
**Plan gate:** All plans (limited by MAX_EMAILS_PER_MONTH)

---

### Financial Dashboard

**Goal:** Give operators visibility into revenue generated through Sendora.

- Revenue summary cards (total, this month, this week)
- Recent transactions list with lead linkage
- Payment history table with filters
- Recharts graphs: revenue over time, payments by domain
- Data sourced from Payment model

**Dependencies:** In-Chat Payments

---

## Phase 3

Polish, scale, and enterprise readiness.

### Integrations Hub

- Integrations page at `/integrations`
- Google Calendar sync for appointments
- CRM connectors (HubSpot, Salesforce) for lead export
- Zapier / webhook outbound triggers
- OAuth connection management UI

---

### FAQ Module

- FAQ builder per domain (question + answer pairs)
- Embed FAQ as standalone widget or inside chatbot
- AI uses FAQ as a knowledge base for responses
- FAQ analytics: most-viewed questions

---

### White-Labeling

- Custom color scheme per workspace (primary, accent, background)
- Custom chatbot domain (e.g., `chat.customer.com`)
- Remove Sendora branding from embeds
- Custom email sender name and reply-to address

**Plan gate:** Ultimate plan only

---

### Analytics & Reporting

- Chatbot performance: sessions, lead conversion rate, drop-off points
- Email marketing: open rate, click rate, unsubscribe rate
- Appointments: booking rate, no-show rate
- Exportable CSV reports
- Date range filters across all metrics

---

### Mobile Responsiveness Audit

- Full audit of all app views on mobile viewports
- Responsive sidebar (sheet/drawer pattern)
- Touch-optimized conversation inbox
- Mobile-friendly campaign editor

---

### Admin Panel (Internal)

- Internal tool for Sendora team
- Per-workspace feature overrides (already in data model via `WorkspaceFeature`)
- Manual subscription adjustments
- Usage monitoring across all workspaces
- Impersonation / support access mode

---

## Dependencies Map

```
Auth & Workspace (done)
  └── Billing & Plans (done)
        └── Feature Gating (done)
              └── Domains (done)
                    └── Chatbot Integration (Now)
                          ├── Lead Capture (Now)
                          │     ├── Conversations (Now)
                          │     ├── Appointments (Next)
                          │     ├── Email Marketing (Next)
                          │     └── In-Chat Payments (Next)
                          │           └── Financial Dashboard (Next)
                          └── FAQ Module (Later)
```

---

## Capacity Notes

- Chatbot Integration is the critical path — it unlocks Leads, Conversations, Appointments, and Payments.
- Email Marketing and Appointments can be developed in parallel once leads exist.
- Financial Dashboard depends on In-Chat Payments having real data.
- Later-phase features (Integrations, Analytics, White-Labeling) should not block any Phase 1 or Phase 2 work.
