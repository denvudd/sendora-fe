# Lead Management — Architecture & Flow

## Overview

Leads are contacts captured automatically when a visitor completes the appointment booking flow on the public portal (`/portal/[token]`). They are **not** created during AI chatbot conversations — only when the visitor provides their name and email in Step 2 of the portal.

---

## Lead Creation Trigger

**Where:** `src/features/appointments/actions/book-appointment-action.ts`

When a visitor submits the contact form in the portal booking step:

1. `upsertLead({ workspaceId, email, firstName })` — creates or updates the lead on `(workspaceId, email)` unique key.
2. `linkSessionToLead({ sessionId, leadId })` — links the `ChatSession` to the lead by setting `ChatSession.leadId = lead.id`.
3. `createBooking({ ..., leadId: lead.id })` — creates a booking associated with the lead.

This means every lead has at least one booking and at least one linked session.

---

## Database Model

`Lead` model (existing):

| Field         | Type         | Description                                                                                        |
| ------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| `workspaceId` | `String`     | FK → Workspace (cascade delete)                                                                    |
| `email`       | `String`     | Email address (unique per workspace)                                                               |
| `firstName`   | `String?`    | First name (or full name from portal form)                                                         |
| `lastName`    | `String?`    | Last name                                                                                          |
| `phone`       | `String?`    | Phone number                                                                                       |
| `source`      | `String?`    | Origin (hardcoded `"chatbot"` on creation)                                                         |
| `status`      | `LeadStatus` | Pipeline stage (default `NEW`)                                                                     |
| `score`       | `Int?`       | Lead score (not currently populated)                                                               |
| `notes`       | `String?`    | Operator notes, free text                                                                          |
| `metadata`    | `Json?`      | Stores `{ questionnaireAnswers: [{question, answer}] }` — readable Q&A pairs from the chat session |

Unique constraint: `(workspaceId, email)` — upserting with the same email updates the name.

`LeadStatus` enum: `NEW` → `CONTACTED` → `QUALIFIED` → `WON` / `LOST`

---

## Lead ↔ Session Link

`ChatSession.leadId` (nullable FK → Lead, set null on delete) is populated by `linkSessionToLead()` inside `bookAppointmentAction`. This allows:

- Lead Detail page to display "View conversation" links.
- Querying sessions for a given lead via `lead.sessions`.

---

## Filters

`listLeadsWithFilters` (lead-repository) supports:

| Filter     | Type          | Behavior                                                     |
| ---------- | ------------- | ------------------------------------------------------------ |
| `domainId` | `String?`     | Only leads that have a session on a chatbot from that domain |
| `status`   | `LeadStatus?` | Exact match on `Lead.status`                                 |
| `dateFrom` | `Date?`       | `Lead.createdAt >= dateFrom`                                 |
| `dateTo`   | `Date?`       | `Lead.createdAt <= dateTo`                                   |

Filters are applied server-side; the URL search params drive the query (no client-side filtering).

---

## Feature Module Structure

```
src/features/leads/
├── actions/
│   ├── get-leads-action.ts           — List leads with optional filters (authenticated)
│   ├── get-lead-action.ts            — Get a single lead by ID (authenticated)
│   ├── update-lead-status-action.ts  — Change pipeline status (authenticated)
│   └── update-lead-notes-action.ts   — Save operator notes (authenticated)
├── components/
│   ├── lead-status-badge.tsx         — Colored badge for LeadStatus enum values
│   ├── lead-status-select.tsx        — Inline status changer (optimistic update)
│   ├── lead-notes-form.tsx           — Textarea + Save button for notes
│   ├── leads-filters.tsx             — Domain / status / date-range filter bar (URL params)
│   ├── leads-table.tsx               — Leads table with View link per row
│   └── lead-detail-view.tsx          — Full lead detail: info, status, notes, bookings, sessions
└── utils.ts                          — LeadWithSession type, leadDisplayName helper

src/app/(app)/leads/
├── page.tsx                          — Leads list page (Server Component, reads searchParams)
└── [leadId]/
    └── page.tsx                      — Lead detail page (Server Component)
```

---

## Data Flow

```
Chat widget (chatbot)
  └── Visitor answers guiding questions
        └── AI outputs {"answers":{...}}{"portal":true}
              └── onFinish → parseAnswersFromText → setSessionAnswers
                    └── ChatSession.metadata = { answers: { [questionId]: string } }

Portal (/portal/[token])
  ├── Step 1 (guiding questions) — pre-filled from ChatSession.metadata.answers
  └── Step 2 contact form → bookAppointmentAction
        ├── Reads session.metadata.answers → maps questionId → question text
        ├── upsertLead → Lead record (status: NEW, metadata.questionnaireAnswers = [{question, answer}])
        ├── linkSessionToLead → ChatSession.leadId = lead.id
        └── createBooking → Booking record (status: PENDING)

Leads page (/leads)
  ├── listLeadsWithFilters → table of leads
  └── LeadsFilters → URL params → server re-fetch

Lead detail (/leads/[leadId])
  ├── findLeadById → lead + sessions + bookings
  ├── LeadStatusSelect → updateLeadStatusAction → optimistic update + router.refresh()
  └── LeadNotesForm → updateLeadNotesAction → router.refresh()
```

---

## HubSpot Sync

When HubSpot integration is enabled on a workspace (Plus/Ultimate plan), leads are automatically pushed to HubSpot as contacts.

### Triggers

- **On lead create/upsert** (`bookAppointmentAction`) — after `upsertLead()`, `syncLeadToHubSpot()` is called fire-and-forget. Pushes `email`, `firstName`, `lastName`, `phone`. Stores the returned HubSpot contact ID in `Lead.hubspotContactId`.
- **On status update** (`updateLeadStatusAction`) — after DB update, `syncLeadToHubSpot()` pushes `sendora_lead_status` custom property to HubSpot.

### Inbound sync (HubSpot → Sendora)

HubSpot sends `contact.propertyChange` webhook events to `POST /api/hubspot/webhook` when `firstname`, `lastname`, or `phone` are changed. The handler verifies the HMAC-SHA256 signature, finds the matching lead via `Lead.hubspotContactId`, and updates the lead fields.

### Loop prevention

`Lead.hubspotSyncedAt` is set each time Sendora pushes to HubSpot. Incoming webhook events with `occurredAt < hubspotSyncedAt` are skipped (they are echoes of our own pushes).

### New Lead fields

| Field              | Type        | Description                                             |
| ------------------ | ----------- | ------------------------------------------------------- |
| `hubspotContactId` | `String?`   | HubSpot contact ID                                      |
| `hubspotSyncedAt`  | `DateTime?` | Last Sendora-initiated push timestamp (loop prevention) |

### Feature gate

`syncLeadToHubSpot()` silently returns if the workspace plan is `STANDARD`. The HubSpot connect card in `/settings/workspace` is visible but disabled for Standard users.
