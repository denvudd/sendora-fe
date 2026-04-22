# Appointments — Architecture & Flow

## Overview

The Appointments feature provides two surfaces:

1. **Domain owner** — configures weekly availability at `/appointments` (authenticated).
2. **Portal visitor** — books a time slot via the public portal at `/portal/[token]` after a chatbot conversation.

Booking data is stored in the existing `Booking` model (linked to a `Lead`). Availability config lives in a new `AppointmentSchedule` model (1:1 with `Workspace`).

---

## Database Models

### `AppointmentSchedule`

Stores the workspace-level availability configuration. One per workspace.

| Field           | Type      | Description                                                       |
| --------------- | --------- | ----------------------------------------------------------------- |
| `workspaceId`   | `String`  | FK → Workspace (unique, cascade delete)                           |
| `isEnabled`     | `Boolean` | Whether online booking is active                                  |
| `slotDuration`  | `Int`     | Duration of each appointment slot in minutes (e.g. 30, 60)        |
| `bufferMinutes` | `Int`     | Gap between consecutive slots (0 = back-to-back)                  |
| `timezone`      | `String`  | IANA timezone for all slot calculations (e.g. `America/New_York`) |
| `schedule`      | `Json`    | Weekly availability map (see format below)                        |

**`schedule` JSON format:**

```json
{
  "1": ["09:00-17:00"],
  "2": ["09:00-17:00"],
  "3": [],
  "5": ["10:00-14:00", "15:00-18:00"]
}
```

- Keys are ISO weekday numbers: `1` = Monday … `7` = Sunday.
- Each key maps to an array of `"HH:MM-HH:MM"` time ranges (24-hour format).
- Days omitted or with an empty array are treated as unavailable.
- Multiple ranges per day are supported (e.g. split lunch break).

### `Booking`

Existing model. Stores confirmed appointments.

| Field      | Type            | Description                                      |
| ---------- | --------------- | ------------------------------------------------ |
| `leadId`   | `String?`       | FK → Lead (the visitor who booked)               |
| `title`    | `String`        | Auto-generated: `"Appointment — {visitor name}"` |
| `startsAt` | `DateTime`      | Slot start (stored as UTC)                       |
| `endsAt`   | `DateTime`      | Slot end (stored as UTC)                         |
| `timezone` | `String`        | Workspace timezone at time of booking            |
| `status`   | `BookingStatus` | `PENDING` on creation                            |

---

## Slot Generation Algorithm

`getAvailableSlotsAction(portalToken, dateStr)`:

1. Look up session → chatbot → domain → workspace → `AppointmentSchedule`.
2. Return `[]` if schedule is missing or `isEnabled = false`.
3. Determine ISO weekday of `dateStr` using `getISODay` from `date-fns`.
4. Read time ranges for that weekday from `schedule` JSON.
5. For each range, generate slots of `slotDuration` minutes, advancing by `slotDuration + bufferMinutes` each step.
6. Construct slot start/end as `TZDate` objects in the workspace timezone (from `@date-fns/tz`) so UTC conversion is correct.
7. Fetch existing `PENDING`/`CONFIRMED`/`COMPLETED`/`NO_SHOW` bookings for that day via `listBookingsForDateRange`.
8. Filter slots using overlap predicate: `slotStart < bookingEnd + buffer AND slotEnd > bookingStart - buffer`.
9. Return `Array<{ label: string; startsAt: ISO; endsAt: ISO }>`.

**Conflict detection uses a true overlap predicate** (`startsAt < to AND endsAt > from`), not containment. The same check is repeated inside `bookAppointmentAction` as a race-condition guard.

---

## Portal Booking Flow

Entry point: `/portal/[token]` (public, no auth).

The server component `PortalPage` fetches the session (including chatbot questions and workspace schedule) via `findSessionByPortalToken`, then renders `PortalBookingFlow`.

```
findSessionByPortalToken
  └── session
      ├── chatbot.questions          (guiding questions for step 1)
      ├── chatbot.domain.hostname    (displayed in UI)
      └── chatbot.domain.workspace
          └── appointmentSchedule   (availability config for step 2)
```

### Step 1 — Guiding Questions (optional)

Skipped entirely if the chatbot has no `ChatbotQuestion` records.

- Each question is rendered as a labeled `<Textarea>`.
- If `ChatSession.metadata.answers` exists (visitor previously submitted), fields are pre-filled.
- On submit: `saveSessionAnswersAction(portalToken, answers)` writes to `ChatSession.metadata.answers`.
- On error: shown inline — the flow does not advance until save succeeds.

### Step 2 — Pick a Date & Time

- **Calendar** (Shadcn `Calendar` / react-day-picker v9, single-select mode):
  - Past dates disabled.
  - Days with no configured ranges disabled via `isDayDisabled` using `getISODay`.
- **Time slot grid**: on date selection, `getAvailableSlotsAction` is called (client-side server action call); a skeleton grid is shown while loading.
- **Contact form** (name + email) appears after a slot is selected.
- On submit: `bookAppointmentAction` is called, which:
  1. Validates input with `bookingSchema` (Zod, `z.iso.datetime({ offset: true })` for datetimes).
  2. Re-checks conflicts (race-condition guard).
  3. Upserts a `Lead` on `(workspaceId, email)`.
  4. Creates a `Booking` linked to the lead.

### Step 3 — Success

Displays a confirmation card with:

- Guest name
- Date and time formatted in the **workspace timezone** (via `TZDate` from `@date-fns/tz`)
- Hostname of the domain

---

## Appointments Management Page

Route: `/appointments` (authenticated, domain owner only).

Server component fetches in parallel:

- `findAppointmentScheduleByWorkspaceId` — existing schedule config (or `null`)
- `listUpcomingBookingsWithLeads({ from: now() })` — upcoming bookings with lead details

Renders two sections:

### Availability Schedule Form (`AppointmentScheduleForm`)

React Hook Form + Zod (`scheduleFormSchema`). Fields:

- **Enable toggle** — `Switch` component, enables/disables booking globally.
- **Slot duration** — select: 15 / 30 / 45 / 60 / 90 / 120 min.
- **Buffer** — select: 0 / 5 / 10 / 15 / 30 min gap between slots.
- **Timezone** — select from preset IANA timezone list.
- **Weekly grid** — Mon–Sun rows; checkbox to enable each day; time range inputs (start / end) when enabled.

On save: `saveScheduleAction(data)` (authenticated server action) upserts the `AppointmentSchedule` record.

### Upcoming Bookings List (`AppointmentsList`)

Table displaying: guest name/email, date, time range, duration, status badge.

- Dates and times formatted in the **booking's stored timezone** (via `TZDate` from `@date-fns/tz`).
- Empty state shown when no upcoming bookings exist.

---

## Session Metadata

`ChatSession.metadata` is a `Json` field. The appointments feature uses it to persist guiding question answers between portal visits:

```ts
// Structure written by saveSessionAnswersAction
{
  answers: {
    [questionId: string]: string
  }
}
```

Existing metadata keys are preserved (spread before writing).

---

## Data Flow

```
Chatbot widget (visitor)
  └── AI detects booking intent → appends {"portal":true}
      └── Chat API onFinish → generatePortalToken()
          └── ChatSession.portalToken set, status = HUMAN
              └── Widget fetches /api/portal-token/[sessionUuid]
                  └── Visitor clicks "Book your appointment" → /portal/[token]

Portal page (/portal/[token])
  ├── Step 1: Questions form → saveSessionAnswersAction → ChatSession.metadata.answers
  ├── Step 2: Calendar + slots
  │     ├── Date select → getAvailableSlotsAction → slot grid
  │     └── Slot + contact form → bookAppointmentAction
  │           ├── upsertLead → Lead record
  │           └── createBooking → Booking record (status: PENDING)
  └── Step 3: Success screen

Appointments page (/appointments) — domain owner
  ├── AppointmentScheduleForm → saveScheduleAction → AppointmentSchedule upsert
  └── AppointmentsList → upcoming Bookings with Leads
```

---

## Feature Module Structure

```
src/features/appointments/
├── actions/
│   ├── save-schedule-action.ts          — Authenticated: upsert AppointmentSchedule
│   ├── get-available-slots-action.ts    — Public: compute available time slots for a date
│   └── book-appointment-action.ts       — Public: create Lead + Booking
├── components/
│   ├── appointment-schedule-form.tsx    — Weekly schedule editor (RHF + Zod)
│   └── appointments-list.tsx            — Upcoming bookings table
└── schemas.ts                           — Zod schemas: scheduleSchema, scheduleFormSchema,
                                           bookingSchema, answersSchema

src/features/portal/
└── components/
    ├── portal-booking-flow.tsx          — Step orchestrator (questions → booking → success)
    ├── portal-questions-step.tsx        — Step 1: guiding questions form
    ├── portal-booking-step.tsx          — Step 2: calendar + slots + contact form
    └── portal-success-step.tsx          — Step 3: confirmation card

src/features/chatbot/actions/
└── save-session-answers-action.ts       — Public: write answers to ChatSession.metadata

src/features/commercial/repositories/
└── appointment-schedule-repository.ts   — upsertAppointmentSchedule, findAppointmentScheduleByWorkspaceId

src/app/
├── (app)/appointments/page.tsx          — Private: schedule config + bookings list
└── (portal)/portal/[token]/page.tsx     — Public: booking wizard entry point
```

---

## Google Meet Integration

Operators can attach a video call link to any booking at confirmation time. Two options are available:

### Option A — Manual link

The operator pastes any URL (Zoom, Teams, Google Meet, etc.) into the confirmation dialog.

### Option B — Auto-generate via Google Meet (free)

Uses the Google Calendar API (free tier) to create a Calendar event with conference data. The generated `meet.google.com` link is saved to the booking and included in the confirmation email.

**Setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth 2.0 Web Application credentials.
2. Enable **Google Calendar API** for the project.
3. Add Authorized redirect URI: `{BASE_URL}/api/google/callback`
4. Set the following env vars:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google/callback
```

**OAuth flow:**

- Operator clicks "Connect Google" in the Appointments page → redirected to `/api/google/auth`.
- After consent, Google redirects to `/api/google/callback` which stores the refresh token in `Workspace.googleRefreshToken`.
- To revoke: operator clicks "Disconnect" → token is cleared from the database.

**Database fields added:**

| Model       | Field                   | Type      | Description                       |
| ----------- | ----------------------- | --------- | --------------------------------- |
| `Workspace` | `googleRefreshToken`    | `String?` | OAuth refresh token               |
| `Workspace` | `googleCalendarEnabled` | `Boolean` | Integration active flag           |
| `Booking`   | `meetingLink`           | `String?` | Meeting URL (manual or generated) |

**Confirm booking flow:**

When an operator changes a booking status to `CONFIRMED`, a dialog appears with three choices:

1. No meeting link — confirm without a link.
2. Enter link manually — paste any URL.
3. Generate via Google Meet — calls Calendar API to create the event + conference.

The resolved link (if any) is saved to `Booking.meetingLink` and included in the confirmation email sent to the guest.

**Module additions:**

```
src/features/appointments/
├── lib/
│   └── google-meet.ts                    — createGoogleMeetEvent, buildGoogleOAuthUrl, exchangeCodeForTokens
├── actions/
│   ├── confirm-booking-action.ts         — Replaces direct CONFIRMED transition; handles link + email
│   └── disconnect-google-calendar-action.ts
└── components/
    ├── google-meet-connect.tsx           — Connect / Disconnect UI card
    └── confirm-booking-dialog.tsx        — Modal with link mode selection

src/app/api/google/
├── auth/route.ts                         — Redirect to Google OAuth consent
└── callback/route.ts                     — Handle code exchange, store token
```

---

## Email Notifications

When an operator changes a booking status to `CONFIRMED`, a confirmation email is automatically sent to the lead.

### Trigger

`updateBookingStatusAction` — after `updateBookingStatus()` succeeds and `status === BookingStatus.CONFIRMED`, the action fetches the booking with its linked lead and sends the email via **Resend**.

Email delivery is fire-and-forget: a send failure is logged but does not affect the status update response.

### Template

Located at `src/features/appointments/emails/booking-confirmation-email.ts`.

`buildBookingConfirmationEmail({ guestName, startsAt, endsAt, timezone, workspaceName })` returns `{ subject, html }`.

Template includes:

- Date, time range, duration, timezone — all formatted in the booking's stored timezone using `TZDate` from `@date-fns/tz`.
- Workspace name as the "Organized by" field.
- Dark-themed inline CSS styled to match the app.

### Environment

```
RESEND_API_KEY=re_xxx   # Required — obtain from resend.com
```

### Sender address

`notifications@sendora.forum` — must be a verified domain in your Resend account.

---

## Timezone Handling

All timezone-aware operations use `TZDate` from `@date-fns/tz` (the `date-fns` v4 companion). Standard `@date-fns/tz` does **not** export `formatInTimeZone` — use `new TZDate(date, timezone)` and then pass to `format()` from `date-fns`:

```ts
import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'

const tzDate = new TZDate(utcDate, 'America/New_York')
format(tzDate, 'h:mm a') // "9:00 AM" in Eastern Time
```

Slot generation constructs `TZDate` objects directly using parsed year/month/day and hour/minute values so UTC conversion is handled automatically by the library.
