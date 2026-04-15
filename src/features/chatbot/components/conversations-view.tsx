'use client'

import type { SessionListItem } from './session-list'
import type { ReactElement } from 'react'

import { MessageSquare } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  getPusherClient,
  PUSHER_CHANNELS,
  PUSHER_EVENTS,
} from '@/shared/lib/pusher'

import { ConversationDetail } from './conversation-detail'
import { SessionList } from './session-list'

interface ConversationsViewProps {
  initialSessions: SessionListItem[]
  workspaceId: string
}

export function ConversationsView({
  initialSessions,
  workspaceId,
}: ConversationsViewProps): ReactElement {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('session')

  const [sessions, setSessions] = useState<SessionListItem[]>(initialSessions)

  // Subscribe to workspace-level Pusher channel for live updates
  useEffect(() => {
    const pusher = getPusherClient()
    const channel = pusher.subscribe(PUSHER_CHANNELS.workspace(workspaceId))

    channel.bind(
      PUSHER_EVENTS.SESSION_ESCALATED,
      (data: {
        sessionId: string
        sessionUuid: string
        domainHostname: string
      }) => {
        setSessions(prev =>
          prev.map(s =>
            s.id === data.sessionId ? { ...s, status: 'HUMAN' as const } : s,
          ),
        )
      },
    )

    channel.bind(
      PUSHER_EVENTS.SESSION_UPDATED,
      (data: { sessionId: string; lastMessage: string; status: string }) => {
        setSessions(prev =>
          prev.map(s => {
            if (s.id !== data.sessionId) {
              return s
            }

            const updatedMessage = {
              role: 'assistant',
              content: data.lastMessage,
              createdAt: new Date(),
            }

            return {
              ...s,
              updatedAt: new Date(),
              status: data.status as SessionListItem['status'],
              messages: data.lastMessage ? [updatedMessage] : s.messages,
            }
          }),
        )
      },
    )

    return () => {
      pusher.unsubscribe(PUSHER_CHANNELS.workspace(workspaceId))
    }
  }, [workspaceId])

  function handleSelectSession(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('session', id)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left panel — session list */}
      <div className="w-full shrink-0 border-r md:w-80 lg:w-96">
        <SessionList
          selectedId={selectedId}
          sessions={sessions}
          onSelect={handleSelectSession}
        />
      </div>

      {/* Right panel — conversation detail */}
      <div className="hidden flex-1 md:flex md:flex-col">
        {selectedId ? (
          <ConversationDetail key={selectedId} sessionId={selectedId} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <MessageSquare className="size-10 opacity-30" />
            <div>
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm">
                Choose a session from the list to view the full dialog.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
