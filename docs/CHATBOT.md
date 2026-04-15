# Chatbot System — Architecture & Flow

## Overview

Each domain in Sendora can have one AI-powered chatbot (1 domain = 1 chatbot). The chatbot is embedded on the domain owner's website via a **`<script>` loader snippet** that dynamically creates an iframe. It engages visitors, collects context via guiding questions, and can transfer the conversation to a human operator.

---

## Architecture

```
Customer's website
  └── <script src="https://app.sendora.io/chatbot/embed" data-domain-id="{domainId}" async>
        └── (script creates) <iframe src="https://app.sendora.io/chatbot/{domainId}">

Sendora app
  ├── /chatbot/embed               — Public embed loader script (JS)
  ├── /chatbot/[domainId]          — Public widget page (inside iframe, server-rendered config)
  ├── /api/chat/[domainId]         — AI streaming API (public, CORS-enabled)
  ├── /api/pusher/auth             — Pusher private channel auth endpoint (authenticated)
  ├── /portal/[token]              — Portal stub page (public)
  ├── /(app)/conversations         — Conversations dashboard (authenticated)
  └── /(app)/domains/[domainId]    — Chatbot configuration (authenticated)
```

### Dependency flow

```
shared → features/commercial/repositories → features/chatbot → app
```

---

## Database Models

### `Domain` (chatbot-relevant fields)

| Field                 | Type        | Description                                    |
| --------------------- | ----------- | ---------------------------------------------- |
| `isVerified`          | `Boolean`   | Whether domain ownership has been confirmed    |
| `verificationToken`   | `String?`   | UUID used for meta tag verification            |
| `verifiedAt`          | `DateTime?` | Timestamp of initial successful verification   |
| `lastVerifiedCheckAt` | `DateTime?` | Timestamp of the most recent periodic re-check |

### `Chatbot`

Stores configuration for a domain's chatbot. 1:1 with `Domain`.

| Field            | Type                  | Description                                                  |
| ---------------- | --------------------- | ------------------------------------------------------------ |
| `id`             | `String (cuid)`       | Primary key                                                  |
| `domainId`       | `String (unique)`     | FK → Domain (cascade delete)                                 |
| `welcomeMessage` | `String`              | First message shown to visitors                              |
| `primaryColor`   | `String`              | Hex color for button, header, user messages                  |
| `buttonStyle`    | `ChatbotButtonStyle`  | `BUBBLE` (floating circle) or `BAR` (bottom strip)           |
| `borderRadius`   | `ChatbotBorderRadius` | Corner style: `NONE` / `SMALL` / `MEDIUM` / `LARGE` / `FULL` |
| `theme`          | `ChatbotTheme`        | `LIGHT` or `DARK` — chat window color scheme                 |
| `chatTitle`      | `String`              | Header title text (default: "Support Chat")                  |
| `chatSubtitle`   | `String`              | Header subtitle text (default: "AI Assistant • Online")      |
| `systemPrompt`   | `String`              | Free-form AI persona instructions                            |
| `isActive`       | `Boolean`             | Whether the chatbot is enabled                               |

### `ChatbotQuestion`

Guiding questions asked by the AI during conversations.

| Field       | Type     | Description                   |
| ----------- | -------- | ----------------------------- |
| `chatbotId` | `String` | FK → Chatbot (cascade delete) |
| `text`      | `String` | Question text                 |
| `sortOrder` | `Int`    | Display/ask order             |

### `ChatSession`

Represents one visitor's conversation session.

| Field         | Type                | Description                                                                                 |
| ------------- | ------------------- | ------------------------------------------------------------------------------------------- |
| `chatbotId`   | `String`            | FK → Chatbot (cascade delete)                                                               |
| `sessionUuid` | `String (unique)`   | UUID stored in visitor's localStorage                                                       |
| `status`      | `ChatSessionStatus` | `AI`, `HUMAN`, or `CLOSED`                                                                  |
| `portalToken` | `String? (unique)`  | Generated when handoff is triggered                                                         |
| `metadata`    | `Json?`             | Stores `{ answers: { [questionId]: string } }` — visitor's chat answers for portal pre-fill |
| `leadId`      | `String?`           | FK → Lead (set null on delete); linked on booking                                           |

`leadId` is populated by `bookAppointmentAction` after the lead is upserted: `linkSessionToLead({ sessionId, leadId })`. This enables the Lead Detail page to surface a "View conversation" link for every session that resulted in a booking.

`metadata.answers` is populated by the chat API's `onFinish` callback when the AI triggers the portal marker — the AI outputs the collected answers as inline JSON, which is parsed and saved to `ChatSession.metadata` via `setSessionAnswers`. The portal page reads this value to pre-fill the guiding questions form.

### `ChatMessage`

Individual messages within a session.

| Field       | Type          | Description           |
| ----------- | ------------- | --------------------- |
| `sessionId` | `String`      | FK → ChatSession      |
| `role`      | `MessageRole` | `user` or `assistant` |
| `content`   | `String`      | Message text          |

### Enums

```prisma
enum ChatbotButtonStyle   { BUBBLE  BAR }
enum ChatbotBorderRadius  { NONE  SMALL  MEDIUM  LARGE  FULL }
enum ChatbotTheme         { LIGHT  DARK }
enum ChatSessionStatus    { AI  HUMAN  CLOSED }
enum MessageRole          { user  assistant }
```

`HUMAN` is used in two cases: visitor explicitly requested a live operator (realtime handoff), or visitor reached the booking portal flow.

---

## Widget Embed Flow

1. Domain owner verifies domain ownership (required before chatbot activates — see below).
2. Domain owner configures chatbot at `/domains/{domainId}` (authenticated). All style/behavior settings are stored in the database.
3. The embed snippet is a **script tag** — it contains no style parameters:
   ```html
   <!-- Sendora Chatbot — paste before </body> -->
   <script
     src="https://app.sendora.io/chatbot/embed"
     data-domain-id="{domainId}"
     async
   ></script>
   ```
4. Snippet is pasted on the customer's website before `</body>`. **The snippet never needs to be updated when styles change.**
5. Visitor loads the page → the script runs, reads `data-domain-id`, and creates an iframe pointing to `/chatbot/{domainId}`.
6. The iframe loads `/chatbot/{domainId}` — the **server component** fetches fresh chatbot config from the database on every request.
7. Config changes (color, border radius, theme, etc.) are reflected immediately on the next page load without any snippet update.
8. Widget renders as a floating button (transparent background — only the button is visible when closed).
9. Visitor clicks button → chat panel expands **within the same iframe** using React state (`isOpen`). No redirect, no navigation.
10. Messages are sent to `POST /api/chat/{domainId}` and streamed back.

### Why script instead of iframe?

The previous approach embedded an `<iframe>` with style params in the URL (`?color=...&style=...`). This meant every style change required the site owner to update and re-paste the snippet. The script approach decouples the snippet from configuration: the script is static, the iframe URL has no params, and the server always serves the latest config from the database.

---

## Session Lifecycle

- On first load, the widget generates `crypto.randomUUID()` and stores it in `localStorage` under `sendora-session-{domainId}`.
- On subsequent loads, the existing UUID is read.
- The widget also reads `document.referrer` (set by the browser to the embedding page URL when inside an iframe) and extracts the hostname as `embedOrigin`.
- `POST /api/chat/{domainId}` receives `{ message, sessionUuid, embedOrigin }` in the request body.
- The API calls `findOrCreateSession({ chatbotId, sessionUuid })` which `upsert`s on `sessionUuid`.
- All messages are persisted in `ChatMessage` and visible in the Conversations dashboard.

---

## Security Model

The chat API enforces two layers of protection before processing any message:

### Layer 1 — Domain Verification Required

```
if (!chatbot.domain.isVerified) {
  return 403 — "Domain not verified"
}
```

The chatbot will not respond until the domain owner has verified ownership via the meta tag flow (see below).

### Layer 2 — Embed Origin Validation

```
if (embedOrigin && embedOrigin !== chatbot.domain.hostname) {
  return 403 — "Not authorized for this domain"
}
```

`embedOrigin` is extracted from `document.referrer` inside the iframe — this value is set by the browser and cannot be spoofed by the embedding page. If the widget is copied to a different domain, the API will reject requests.

**Allowed cases:**

- `embedOrigin` is `null` or empty — direct access (dashboard preview, testing) is permitted.
- `embedOrigin` matches `chatbot.domain.hostname` exactly — normal embedded usage.

---

## Domain Verification

Before the chatbot activates, the domain owner must verify ownership. A verification token is generated when a domain is created and stored in `Domain.verificationToken`.

### Initial Verification Flow

1. Token is generated in `createDomain` via `crypto.randomUUID()`.
2. Domain page shows `DomainVerificationCard` with the meta tag to add:
   ```html
   <meta name="sendora-verification" content="{token}" />
   ```
3. User adds the tag to their homepage `<head>` and clicks "Verify domain".
4. `verifyDomainAction` fetches `https://{hostname}` server-side (10 s timeout, falls back to `http://`).
5. Reads up to 50 KB of HTML (stops after `</head>`).
6. Regex-checks for the meta tag with the correct token (any attribute order).
7. On success: sets `Domain.isVerified = true` and `Domain.verifiedAt = now()`.

### Periodic Re-verification

The widget page re-checks the meta tag on every iframe load, **throttled to once per hour** using `Domain.lastVerifiedCheckAt`:

- On load: if `lastVerifiedCheckAt` is `null` or older than 1 hour, the server fetches the domain homepage and checks for the meta tag.
- If the tag is **missing**: `Domain.isVerified` is set to `false` and the widget renders a blank/blocked state (no error is exposed publicly).
- If the tag is **present**: `Domain.lastVerifiedCheckAt` is updated to `now()`.
- Subsequent loads within the same hour skip the HTTP check and use the stored `isVerified` flag.

**Effect:** Removing the meta tag after initial verification will block the chatbot within one hour.

**Files:**

- `src/features/domains/lib/check-domain-meta-tag.ts` — shared `fetchDomainHtml` + `checkMetaTag` utilities
- `src/features/domains/actions/verify-domain-action.ts` — initial verification server action (imports from shared lib)
- `src/app/(chatbot)/chatbot/[domainId]/page.tsx` — server component that performs periodic re-check on widget load
- `src/features/domains/components/domain-verification-card.tsx` — verification UI card
- `src/features/commercial/repositories/domain-repository.ts` — `updateDomainVerification` (initial), `updateDomainVerificationCheck` (periodic)

---

## "Powered by Sendora" Branding

The chat window displays a small "Powered by Sendora" link in the footer when the domain's workspace is on the **STANDARD (free) plan**. It is automatically hidden for **PLUS** and **ULTIMATE** plan subscribers.

The branding flag is resolved server-side on the widget page:

```ts
const planCode = activeSubscription?.plan.code ?? 'STANDARD'
const showBranding = planCode === 'STANDARD'
```

The `showBranding` prop is passed down to the `ChatbotWidget` client component — no client-side plan check is performed.

---

## Widget Customization

All visual customization fields are stored in the `Chatbot` model and applied at render time. No URL params are used.

| Setting          | Type                  | Options / Default                                                 |
| ---------------- | --------------------- | ----------------------------------------------------------------- |
| `primaryColor`   | Hex color string      | Any `#RRGGBB` — default `#6366f1`                                 |
| `buttonStyle`    | `ChatbotButtonStyle`  | `BUBBLE` (circle) / `BAR` (strip) — default `BUBBLE`              |
| `borderRadius`   | `ChatbotBorderRadius` | `NONE` / `SMALL` / `MEDIUM` / `LARGE` / `FULL` — default `MEDIUM` |
| `theme`          | `ChatbotTheme`        | `LIGHT` / `DARK` — default `LIGHT`                                |
| `chatTitle`      | String (max 60)       | Header title — default `"Support Chat"`                           |
| `chatSubtitle`   | String (max 80)       | Header subtitle — default `"AI Assistant • Online"`               |
| `welcomeMessage` | String (max 300)      | First message shown — default `"Hi! How can I help you today?"`   |

Border radius is applied to the chat panel via Tailwind class mapping:

```ts
{ NONE: 'rounded-none', SMALL: 'rounded-lg', MEDIUM: 'rounded-2xl', LARGE: 'rounded-3xl', FULL: 'rounded-[2rem]' }
```

`DARK` theme applies the `dark` class to the widget wrapper, enabling all existing `dark:` Tailwind variants.

---

## AI Integration

**Provider:** OpenAI via Vercel AI SDK (`ai` + `@ai-sdk/openai`)  
**Model:** `gpt-4o-mini` (cost-effective, fast)  
**Streaming:** `streamText()` → `result.toTextStreamResponse()` → manual `fzetch` + `ReadableStream` reader on the client

> Note: `ai` v6 renamed `toDataStreamResponse()` to `toTextStreamResponse()` and changed the `useChat` hook API significantly. The widget uses a manual `fetch` + streaming approach for full control over the stream format.

### System Prompt Composition

The system prompt is built at runtime by `buildSystemPrompt(chatbot)` in `src/features/chatbot/utils.ts`. It selects one of two conversation flows based on whether guiding questions are configured:

**With guiding questions (`withQuestionsFlow`):**

1. Role & persona (custom `systemPrompt` or default based on domain hostname)
2. Goal: ask all guiding questions one at a time, then trigger booking portal
3. Numbered question list with each question's database ID (e.g. `1. [id: "abc123"] What is your budget?`)
4. Portal trigger instruction: output `{"answers":{...}}` then `{"portal":true}` on separate lines once all questions are answered

**Without guiding questions (`noQuestionsFlow`):**

1. Role & persona
2. Goal: briefly introduce the business, then immediately propose booking
3. Portal trigger instruction: output `{"portal":true}` when visitor shows interest

**Shared sections (appended to both flows):**

- Communication style (concise, one question at a time, no contact details)
- Accuracy (do not invent information)
- Scope (only business-related topics)
- Realtime handoff: append `{"realtime":true}` when visitor explicitly requests a human
- Portal trigger rules (do not add anything after the JSON lines)

### Realtime Handoff Detection

When the AI determines a visitor explicitly wants to speak with a human, it appends `{"realtime":true}` on a new line at the end of its response. The chat API's `onFinish` callback:

1. Strips the marker from the stored message
2. Calls `setSessionHuman({ sessionId })` → sets `ChatSession.status = HUMAN`
3. Triggers Pusher event `status-changed` on `chat-{sessionUuid}` (public channel) → widget shows "Connected to a live agent" banner
4. Triggers Pusher event `session-escalated` on `private-workspace-{workspaceId}` → dashboard updates the session badge to "Live"

After the status change, the widget input remains enabled but messages go through the chat API without AI processing — they are forwarded to the dashboard via Pusher in real-time. The operator can then reply from the Conversations dashboard.

### Portal Link Detection

When the AI determines a visitor is ready to book an appointment, it outputs two JSON lines at the end of its response:

```
{"answers":{"<questionId>":"<answer>", ...}}
{"portal":true}
```

The `{"answers":{...}}` line is only present when guiding questions were configured. The widget:

1. Detects `{"portal":true}` in the accumulated stream
2. Strips both JSON lines before rendering via `stripMarkers()` (also strips `{"realtime":true}`)
3. Sets `isPortalReady = true` → hides the input, fetches the portal URL, shows "Book your appointment" CTA

Simultaneously, the chat API's `onFinish` callback:

1. Calls `parseAnswersFromText(text)` — a synchronous parser that extracts the inline `{"answers":{...}}` JSON by brace-depth counting (no extra AI call)
2. Saves the answers to `ChatSession.metadata` via `setSessionAnswers()` if any were found
3. Calls `generatePortalToken()` — sets `ChatSession.portalToken = crypto.randomUUID()` and `ChatSession.status = HUMAN`

The portal page then reads `session.metadata.answers` and passes it to the booking form as `defaultAnswers` for pre-fill.

---

## Portal Link Generation

When booking readiness is detected, the chat API's `onFinish` callback automatically:

- Calls `generatePortalToken({ sessionId })` which sets `ChatSession.portalToken = crypto.randomUUID()` and `ChatSession.status = HUMAN`
- The portal URL is `/portal/{token}`

The widget then calls `GET /api/portal-token/{sessionUuid}` (public endpoint) to retrieve the portal URL and renders it as a "Book your appointment" button. The endpoint retries a few times to account for the async `onFinish` write.

### Portal Page (`/portal/[token]`) — Booking Flow

The portal page renders a multi-step booking wizard: guiding questions (if any) → date/time selection → confirmation screen.

Full documentation: [`docs/APPOINTMENTS.md`](./APPOINTMENTS.md)

---

## Public Routes

The following routes bypass Clerk authentication (configured in `src/proxy.ts`):

| Route                    | Reason                                                       |
| ------------------------ | ------------------------------------------------------------ |
| `/api/chat/(.*)`         | Widget visitors are not Sendora users                        |
| `/api/portal-token/(.*)` | Widget retrieves portal URL by session UUID (no auth needed) |
| `/chatbot/(.*)`          | Widget page and embed script are public                      |
| `/portal/(.*)`           | Portal is accessed by non-authenticated visitors             |

---

## CORS & Framing

Configured in `next.config.ts`:

- `/chatbot/:path*` — `X-Frame-Options: ALLOWALL` + `Content-Security-Policy: frame-ancestors *` (allow embedding in any website)
- `/chatbot/embed` — `Access-Control-Allow-Origin: *` (allow cross-origin `<script>` loading of the embed loader)
- `/api/chat/:path*` — `Access-Control-Allow-Origin: *` (allow cross-origin requests from embedded widgets)

The widget page also sets `background: transparent` on `html, body` so the iframe is invisible when the chat panel is closed.

---

## Feature Module Structure

```
src/features/chatbot/
├── actions/
│   ├── create-chatbot-action.ts              — Create chatbot for a domain
│   ├── update-chatbot-settings-action.ts     — Update config (color, style, borderRadius, theme, etc.)
│   ├── update-chatbot-questions-action.ts    — Replace guiding questions
│   ├── generate-portal-link-action.ts        — Generate portal token + URL (legacy, used in portal flow)
│   ├── get-session-messages-action.ts        — Fetch session with full message history (for dashboard)
│   ├── set-session-human-action.ts           — Manually escalate session to HUMAN + Pusher events
│   ├── send-operator-message-action.ts       — Operator sends message in HUMAN session + Pusher events
│   └── send-portal-link-message-action.ts    — Generate + send portal link as message to customer
├── components/
│   ├── chatbot-settings-form.tsx             — Create/edit chatbot config form (all customization fields)
│   ├── chatbot-questions-editor.tsx          — Add/remove/reorder guiding questions
│   ├── chatbot-preview.tsx                   — Visual mockup reflecting all customization options
│   ├── chatbot-snippet.tsx                   — Script embed snippet card with copy button
│   ├── chatbot-widget.tsx                    — Client component rendering the interactive chat widget
│   ├── conversations-view.tsx                — Conversations dashboard client wrapper (Pusher workspace sub)
│   ├── session-list.tsx                      — Filterable list of chat sessions with status badges
│   └── conversation-detail.tsx               — Full dialog view with operator controls (HUMAN mode)
└── schemas.ts                                — Zod schemas for settings and questions

src/features/domains/
├── actions/
│   └── verify-domain-action.ts             — Initial domain verification server action
├── components/
│   └── domain-verification-card.tsx        — Shows verification status, meta snippet, verify button
└── lib/
    └── check-domain-meta-tag.ts            — Shared fetchDomainHtml + checkMetaTag utilities

src/features/commercial/repositories/
└── chatbot-repository.ts                   — All DB access for Chatbot, ChatSession, ChatMessage
                                              (includes findChatbotWithPlanByDomainId for branding check)

src/app/
├── api/chat/[domainId]/route.ts            — AI streaming API (public)
├── api/portal-token/[sessionUuid]/route.ts — Returns portal URL for a session UUID (public)
├── (chatbot)/chatbot/embed/route.ts        — Embed loader JS served at /chatbot/embed (public)
├── (chatbot)/chatbot/[domainId]/page.tsx   — Widget server component (fetches config, re-verifies domain)
└── (portal)/portal/[token]/page.tsx        — Portal stub page (public)
```

---

## Chatbot Configuration UI

The domain detail page (`/domains/{domainId}`) includes:

1. **Domain Verification** — Shows verification status badge. If unverified: displays the meta tag snippet and a "Verify domain" button. If verified: shows green shield + verified date.
2. **Chatbot Settings** — When no chatbot exists, shows "Enable chatbot" CTA. When active, shows edit form with:
   - Welcome message
   - Primary color (color picker)
   - Button style (Bubble / Bar)
   - Color theme (Light / Dark)
   - Border radius (None / Small / Medium / Large / Full)
   - Chat window title
   - Chat window subtitle
   - AI persona (system prompt)
   - Active/inactive toggle
3. **Guiding Questions** — Add/remove up to 10 questions using React Hook Form `useFieldArray`.
4. **Widget Preview** — Live mockup showing the button, header (with title/subtitle), and welcome message bubble, reflecting all current settings including theme and border radius.
5. **Embed Snippet** — Script tag snippet with one-click copy. No style params — snippet never needs to be updated when styles change.

---

## Realtime Architecture (Pusher)

Real-time messaging uses [Pusher Channels](https://pusher.com/channels/).

### Channel Structure

| Channel                           | Type    | Used by   | Description                                              |
| --------------------------------- | ------- | --------- | -------------------------------------------------------- |
| `chat-{sessionUuid}`              | Public  | Widget    | Per-session channel embedded in iframe; no auth required |
| `private-workspace-{workspaceId}` | Private | Dashboard | Workspace-level alerts; requires Clerk auth              |
| `private-session-{sessionId}`     | Private | Dashboard | Per-session messages for opened conversation view        |

### Events

| Channel                           | Event                  | Payload                                      | Trigger                                                   |
| --------------------------------- | ---------------------- | -------------------------------------------- | --------------------------------------------------------- |
| `chat-{sessionUuid}`              | `status-changed`       | `{ status: 'HUMAN' }`                        | AI detects REALTIME_MARKER or operator manually escalates |
| `chat-{sessionUuid}`              | `operator-message`     | `{ id, content, createdAt }`                 | Operator sends message in dashboard                       |
| `private-workspace-{workspaceId}` | `session-escalated`    | `{ sessionId, sessionUuid, domainHostname }` | Session becomes HUMAN                                     |
| `private-workspace-{workspaceId}` | `session-updated`      | `{ sessionId, lastMessage, status }`         | Any new message in any session                            |
| `private-session-{sessionId}`     | `new-customer-message` | `{ id, role, content, createdAt }`           | Customer sends message in HUMAN session                   |

### Auth Endpoint

`POST /api/pusher/auth` — authenticates private channels. Uses Clerk `auth()` to verify the requesting user owns the workspace in the channel name. For `private-session-*` channels, additionally verifies the session belongs to that workspace.

### Lib Location

- `src/shared/lib/pusher.ts` — server-side `pusherServer` instance, client-side `getPusherClient()` singleton, channel/event name constants

---

## Conversations Dashboard

Route: `/conversations`

A two-panel layout for monitoring and managing all chatbot sessions across all domains:

- **Left panel** — Session list filterable by All / Live (HUMAN) / AI. Each item shows domain hostname, last message preview, relative timestamp, and status badge. Sessions in `HUMAN` status show a red alert icon.
- **Right panel** — Full conversation dialog. Selecting a session loads all messages via `getSessionMessagesAction`.

### Operator Controls (HUMAN sessions only)

When a session is in `HUMAN` mode, the conversation detail view shows:

- **Message input** — Textarea (Enter to send, Shift+Enter for newline). Sends via `sendOperatorMessageAction`, which saves to DB and pushes via Pusher to the widget.
- **Send Portal Link button** — Calls `sendPortalLinkMessageAction`, generates a portal token and sends the booking URL as a message to the customer.

### Manual Escalation

For `AI` sessions, an operator can click "Transfer to Human" to manually escalate via `setSessionHumanAction`. This updates `ChatSession.status = HUMAN` and triggers Pusher events to notify both the widget and the dashboard.

### Real-time Updates

- The Conversations view subscribes to `private-workspace-{workspaceId}` via Pusher to update session badges and last-message previews without page refresh.
- The ConversationDetail view subscribes to `private-session-{sessionId}` to append incoming customer messages in real-time.

---

## Environment Variables

| Variable                     | Scope  | Required | Description                                                                      |
| ---------------------------- | ------ | -------- | -------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`             | Server | Yes      | OpenAI API key                                                                   |
| `NEXT_PUBLIC_APP_URL`        | Client | Yes      | App base URL (e.g. `https://app.sendora.io`) — used in embed script and snippets |
| `PUSHER_APP_ID`              | Server | Yes      | Pusher application ID                                                            |
| `PUSHER_KEY`                 | Server | Yes      | Pusher key (server-side)                                                         |
| `PUSHER_SECRET`              | Server | Yes      | Pusher secret                                                                    |
| `PUSHER_CLUSTER`             | Server | Yes      | Pusher cluster (e.g. `eu`)                                                       |
| `NEXT_PUBLIC_PUSHER_KEY`     | Client | Yes      | Pusher key exposed to client                                                     |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Client | Yes      | Pusher cluster exposed to client                                                 |

---

## Breaking Changes

| #   | Change                                                                              | Impact                                                                                                                            |
| --- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Embed snippet changed from `<iframe>` to `<script>`                                 | Existing users with the old iframe snippet must replace it. Old snippets will continue to work but won't auto-sync style changes. |
| 2   | Widget page is now a Server Component                                               | Config is fetched from DB on each load; URL params `?color` and `?style` are no longer read                                       |
| 3   | `ChatbotWidget` extracted to `chatbot-widget.tsx`                                   | `chatbot/[domainId]/page.tsx` no longer contains the interactive code                                                             |
| 4   | `Chatbot` model: 4 new fields added                                                 | Requires `prisma db push` — existing rows get defaults (`MEDIUM`, `LIGHT`, `"Support Chat"`, `"AI Assistant • Online"`)           |
| 5   | `Domain` model: `lastVerifiedCheckAt` added                                         | Requires `prisma db push` — starts as `null`, re-check triggers on next widget load                                               |
| 6   | `updateDomainVerificationCheck` added to domain-repository                          | New export in `repositories/index.ts`                                                                                             |
| 7   | `findChatbotWithPlanByDomainId` added to chatbot-repository                         | New export in `repositories/index.ts` — used by widget page for branding check                                                    |
| 8   | `fetchDomainHtml` / `checkMetaTag` moved to `domains/lib/check-domain-meta-tag.ts`  | `verify-domain-action.ts` now imports from shared lib                                                                             |
| 9   | Periodic domain re-verification on widget load                                      | If meta tag is removed post-verification, widget blocks within ≤1 hour                                                            |
| 10  | `ChatbotPreview` requires 4 new props                                               | `DomainPage` call site updated accordingly                                                                                        |
| 11  | `next.config.ts` adds CORS header for `/chatbot/embed`                              | Required for cross-origin `<script>` loading                                                                                      |
| 12  | Pusher added (`pusher` + `pusher-js`); new env vars required                        | Requires 6 new env vars; chat API updated to bypass AI for HUMAN sessions                                                         |
| 13  | `findChatbotByDomainId` now includes `domain.workspaceId`                           | Chat API uses it to trigger workspace-level Pusher events                                                                         |
| 14  | Chat API (`/api/chat/[domainId]`) short-circuits when `session.status === 'HUMAN'`  | Customer messages in HUMAN sessions are forwarded via Pusher instead of going to OpenAI                                           |
| 15  | Conversations page (`/conversations`) implemented                                   | Replaces placeholder; requires `findSessionsByWorkspaceId` from updated chatbot-repository                                        |
| 16  | Widget subscribes to Pusher on mount; handles `status-changed` + `operator-message` | Widget now renders "Connected to live agent" banner and displays operator messages in real-time                                   |
