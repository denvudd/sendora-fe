import Pusher from 'pusher'
import PusherJs from 'pusher-js'

// --- Server-side Pusher instance ---

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

// --- Client-side Pusher singleton ---

let pusherClient: PusherJs | null = null

export function getPusherClient(): PusherJs {
  if (!pusherClient) {
    pusherClient = new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    })
  }

  return pusherClient
}

// --- Channel / Event name helpers ---

export const PUSHER_CHANNELS = {
  /** Public channel for the embedded widget (no auth required) */
  chatSession: (sessionUuid: string) => `chat-${sessionUuid}`,
  /** Private channel for workspace-level dashboard alerts */
  workspace: (workspaceId: string) => `private-workspace-${workspaceId}`,
  /** Private channel for real-time messages in an open conversation */
  session: (sessionId: string) => `private-session-${sessionId}`,
}

export const PUSHER_EVENTS = {
  // Widget (public channel) events
  STATUS_CHANGED: 'status-changed',
  OPERATOR_MESSAGE: 'operator-message',
  SESSION_CLOSED: 'session-closed',
  // Dashboard (private channel) events
  SESSION_ESCALATED: 'session-escalated',
  SESSION_UPDATED: 'session-updated',
  NEW_CUSTOMER_MESSAGE: 'new-customer-message',
}
