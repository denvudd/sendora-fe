# HubSpot Integration — Design Spec

**Date:** 2026-04-17  
**Status:** Approved  
**Scope:** Bidirectional contact sync between Sendora leads and HubSpot contacts, per-workspace OAuth, available on Plus and Ultimate plans.

---

## Overview

Each Sendora workspace can connect its own HubSpot account via OAuth. Once connected, leads captured in Sendora are automatically pushed to HubSpot as contacts. Changes to contact properties in HubSpot (name, phone) are reflected back in Sendora via webhooks. Sync is fire-and-forget on the push side; webhook delivery is real-time.

---

## Architecture

### OAuth Flow (per workspace)

Mirrors the existing Google Calendar OAuth pattern in `src/features/appointments/`.

1. Operator navigates to workspace settings → clicks "Connect HubSpot".
2. Redirected to `/api/hubspot/auth` → builds HubSpot OAuth URL → redirect to HubSpot consent screen.
3. HubSpot redirects to `/api/hubspot/callback?code=...`.
4. Server exchanges `code` for `access_token` + `refresh_token` via HubSpot token endpoint.
5. Stores `refresh_token` in `Workspace.hubspotRefreshToken`, sets `Workspace.hubspotEnabled = true`.
6. Operator sees "Connected" state in the UI card.

HubSpot access tokens expire after 30 minutes. A helper `getHubSpotAccessToken(workspace)` automatically refreshes using the stored refresh token before every API call.

### Sendora → HubSpot (push)

Triggered at two points:

- `upsertLead()` inside `book-appointment-action.ts` — creates or updates a HubSpot contact via `POST /crm/v3/objects/contacts/upsert` (idempotent by email). Saves the returned `hubspotContactId` to `Lead.hubspotContactId`.
- `updateLeadStatusAction()` — updates the custom HubSpot property `sendora_lead_status` on the contact.

Both calls are fire-and-forget: a failure logs `console.error` but does not affect the primary operation.

### HubSpot → Sendora (webhook)

HubSpot is configured with a webhook subscription for `contact.propertyChange` on properties: `firstname`, `lastname`, `phone`.

Incoming events are delivered to `POST /api/hubspot/webhook`.

The handler:

1. Verifies the `X-HubSpot-Signature-v3` HMAC-SHA256 signature. Returns `401` on failure.
2. Looks up the lead by `hubspotContactId`.
3. Checks loop prevention (see below).
4. Updates `Lead.firstName`, `Lead.lastName`, or `Lead.phone` accordingly.
5. Always returns `200` after signature verification to prevent HubSpot retries on application-level skips.

### Loop Prevention

When Sendora pushes a change to HubSpot, HubSpot echoes it back as a webhook event. To prevent an infinite loop:

- `Lead` gains a nullable `hubspotSyncedAt: DateTime?` field.
- Every time Sendora pushes to HubSpot, it sets `hubspotSyncedAt = now()`.
- On incoming webhook: if `hubspotSyncedAt > event.occurredAt` → skip (our own change reflected back).

This is more reliable than an `updatedAt` comparator because it is explicit and not affected by other lead field updates.

### Workspace Identification in Webhooks

HubSpot webhooks do not carry workspace context natively. The workspace is identified by looking up the lead via `Lead.hubspotContactId` (unique per workspace by the `(workspaceId, email)` constraint). No `workspaceId` query param needed.

---

## Database Changes

### `Workspace` model

| Field                 | Type      | Description                               |
| --------------------- | --------- | ----------------------------------------- |
| `hubspotRefreshToken` | `String?` | OAuth refresh token                       |
| `hubspotEnabled`      | `Boolean` | Integration active flag (default `false`) |

### `Lead` model

| Field              | Type        | Description                                                        |
| ------------------ | ----------- | ------------------------------------------------------------------ |
| `hubspotContactId` | `String?`   | HubSpot contact ID, stored after first push                        |
| `hubspotSyncedAt`  | `DateTime?` | Timestamp of last Sendora-initiated push, used for loop prevention |

---

## Feature Gate

`syncLeadToHubSpot()` checks the workspace plan before any API call:

```ts
if (planCode === 'STANDARD') return // silent no-op
```

The HubSpot Connect card in workspace settings is visible to all plans but renders as disabled with an upgrade prompt for Standard users.

---

## Error Handling

| Scenario                              | Behavior                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| HubSpot API error on push             | Log error, do not fail the primary action                                             |
| Refresh token expired / revoked       | Set `hubspotEnabled = false`, clear `hubspotRefreshToken`. Card shows "Disconnected". |
| Invalid webhook signature             | Return `401`                                                                          |
| Lead not found for `hubspotContactId` | Log, return `200` (no retry needed)                                                   |
| Plan is Standard                      | Silent no-op on push; UI gate on connect                                              |

---

## Module Structure

### New files

```
src/features/workspace-settings/
├── lib/
│   └── hubspot.ts                        — getHubSpotAccessToken, upsertHubSpotContact,
│                                           buildHubSpotOAuthUrl, exchangeCodeForTokens
├── actions/
│   ├── disconnect-hubspot-action.ts      — Clear tokens, set hubspotEnabled = false
│   └── sync-lead-to-hubspot-action.ts    — Push a single lead (called from leads feature)
└── components/
    └── hubspot-connect.tsx               — Connect / Disconnect UI card

src/app/api/hubspot/
├── auth/route.ts                         — Redirect to HubSpot OAuth consent
├── callback/route.ts                     — Exchange code for tokens, save to Workspace
└── webhook/route.ts                      — Handle incoming HubSpot contact.propertyChange events
```

### Modified files

| File                                                           | Change                                          |
| -------------------------------------------------------------- | ----------------------------------------------- |
| `src/features/appointments/actions/book-appointment-action.ts` | Call `syncLeadToHubSpot()` after `upsertLead()` |
| `src/features/leads/actions/update-lead-status-action.ts`      | Push status update to HubSpot after DB update   |
| `src/app/(app)/workspace-settings/page.tsx`                    | Add `HubSpotConnect` card                       |
| `prisma/schema.prisma`                                         | Add new fields to `Workspace` and `Lead`        |

---

## UI

### HubSpot Connect card (`/workspace-settings`)

**Disconnected state:**

- "Connect HubSpot" button
- Short description: "Automatically sync leads captured in Sendora to your HubSpot account as contacts."

**Connected state:**

- Green badge + connected HubSpot portal name or email
- "Disconnect" button → calls `disconnectHubSpotAction`

**Standard plan state:**

- Card visible but disabled
- Tooltip/badge: "Available on Plus and above"

---

## Environment Variables

| Variable                | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| `HUBSPOT_CLIENT_ID`     | HubSpot OAuth app client ID                             |
| `HUBSPOT_CLIENT_SECRET` | HubSpot OAuth app client secret + webhook signature key |
| `HUBSPOT_REDIRECT_URI`  | e.g. `https://yourdomain.com/api/hubspot/callback`      |

---

## HubSpot App Setup (one-time, by developer)

1. Create a Private App or OAuth App in HubSpot Developer portal.
2. Enable scopes: `crm.objects.contacts.read`, `crm.objects.contacts.write`.
3. Register webhook subscription for `contact.propertyChange` → target URL `{BASE_URL}/api/hubspot/webhook`.
4. Set env vars above.
5. Create custom contact property `sendora_lead_status` (string) in HubSpot account via API or UI.

---

## Data Flow Summary

```
Visitor books appointment (portal)
  └── bookAppointmentAction
        ├── upsertLead → Lead record
        └── syncLeadToHubSpot (fire-and-forget)
              ├── getHubSpotAccessToken (refresh if needed)
              ├── POST /crm/v3/objects/contacts/upsert
              ├── Lead.hubspotContactId = returned id
              └── Lead.hubspotSyncedAt = now()

Operator updates lead status (/leads/[leadId])
  └── updateLeadStatusAction
        ├── DB update
        └── syncLeadToHubSpot (fire-and-forget)
              └── PATCH /crm/v3/objects/contacts/{id} { sendora_lead_status }

HubSpot contact updated (e.g. sales rep edits name)
  └── POST /api/hubspot/webhook
        ├── Verify X-HubSpot-Signature-v3
        ├── Find Lead by hubspotContactId
        ├── Check hubspotSyncedAt vs event.occurredAt → skip if loop
        └── Update Lead.firstName / lastName / phone
```
