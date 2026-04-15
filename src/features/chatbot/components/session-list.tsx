'use client'

import type { ChatSessionStatus } from '@prisma/client'
import type { ReactElement } from 'react'

import { formatDistanceToNow } from 'date-fns'
import { AlertCircle, Bot } from 'lucide-react'
import { useState } from 'react'

import { stripMarkers, containsRealtimeMarker } from '@/features/chatbot/utils'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { cn } from '@/shared/utils/cn'

export interface SessionListItem {
  id: string
  sessionUuid: string
  status: ChatSessionStatus
  updatedAt: Date
  chatbot: {
    domain: {
      hostname: string
    }
  }
  messages: Array<{
    role: string
    content: string
    createdAt: Date
  }>
}

interface SessionListProps {
  sessions: SessionListItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

type FilterTab = 'all' | 'human' | 'ai'

const STATUS_BADGE: Record<
  ChatSessionStatus,
  {
    label: string
    variant: 'default' | 'destructive' | 'secondary' | 'outline'
  }
> = {
  AI: { label: 'AI', variant: 'secondary' },
  HUMAN: { label: 'Live', variant: 'destructive' },
  CLOSED: { label: 'Closed', variant: 'outline' },
}

function getPreviewText(content: string): string {
  if (containsRealtimeMarker(content)) {
    const clean = stripMarkers(content)

    return clean || '⚡ Session transferred to live agent'
  }

  return stripMarkers(content).slice(0, 80)
}

export function SessionList({
  sessions,
  selectedId,
  onSelect,
}: SessionListProps): ReactElement {
  const [filter, setFilter] = useState<FilterTab>('all')

  const filtered = sessions.filter(s => {
    if (filter === 'human') {
      return s.status === 'HUMAN'
    }

    if (filter === 'ai') {
      return s.status === 'AI'
    }

    return true
  })

  const needsAttentionCount = sessions.filter(s => s.status === 'HUMAN').length

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <Tabs value={filter} onValueChange={v => setFilter(v as FilterTab)}>
          <TabsList className="w-full">
            <TabsTrigger className="flex-1" value="all">
              All
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                {sessions.length}
              </span>
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="human">
              Live
              {needsAttentionCount > 0 && (
                <span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-xs font-medium text-destructive-foreground">
                  {needsAttentionCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="ai">
              AI
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-muted-foreground">
            <Bot className="size-8 opacity-40" />
            <p>No conversations found</p>
          </div>
        )}

        {filtered.map(session => {
          const lastMsg = session.messages[0]
          const isSelected = session.id === selectedId
          const badge = STATUS_BADGE[session.status]
          const isHuman = session.status === 'HUMAN'

          return (
            <button
              key={session.id}
              className={cn(
                'w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted/50',
                isSelected && 'bg-muted',
              )}
              type="button"
              onClick={() => onSelect(session.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {isHuman && (
                      <AlertCircle className="size-3.5 shrink-0 text-destructive" />
                    )}
                    <span className="truncate text-sm font-medium">
                      {session.chatbot.domain.hostname}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {lastMsg
                      ? getPreviewText(lastMsg.content)
                      : 'No messages yet'}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge
                    className="px-1.5 py-0 text-[10px]"
                    variant={badge.variant}
                  >
                    {badge.label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(session.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
