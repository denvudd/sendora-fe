import type { NextRequest } from 'next/server'

import {
  addMessage,
  findChatbotByDomainId,
  findOrCreateSession,
  generatePortalToken,
  getSessionMessages,
  setSessionAnswers,
  setSessionHuman,
} from '@features/commercial/repositories'
import {
  pusherServer,
  PUSHER_CHANNELS,
  PUSHER_EVENTS,
} from '@shared/lib/pusher'
import { streamText } from 'ai'

import { env } from '@/env'
import {
  buildSystemPrompt,
  MODEL,
  parseAnswersFromText,
  PORTAL_MARKER,
  REALTIME_MARKER,
} from '@/features/chatbot/utils'

export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

interface RouteParams {
  params: Promise<{ domainId: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<Response> {
  const { domainId } = await params

  let body: { message?: string; sessionUuid?: string; embedOrigin?: string }

  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: 'Invalid request body' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const { message, sessionUuid, embedOrigin } = body

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return Response.json(
      { error: 'Message is required' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  if (!sessionUuid || typeof sessionUuid !== 'string') {
    return Response.json(
      { error: 'sessionUuid is required' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const chatbot = await findChatbotByDomainId({ domainId })

  if (!chatbot || !chatbot.isActive) {
    return Response.json(
      { error: 'Chatbot not found' },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  // Require domain verification before accepting any chat messages
  if (!chatbot.domain.isVerified) {
    return Response.json(
      {
        error:
          'Domain not verified. Please verify your domain in the Sendora dashboard.',
      },
      { status: 403, headers: CORS_HEADERS },
    )
  }

  // Validate the origin where the widget is embedded.
  // embedOrigin comes from document.referrer inside the iframe (set by the browser, not the parent page).
  // Allow: no origin (direct access / testing from the dashboard)
  // Block: origin present but doesn't match the verified domain hostname
  if (embedOrigin && embedOrigin !== chatbot.domain.hostname) {
    return Response.json(
      { error: 'This chatbot is not authorized for this domain.' },
      { status: 403, headers: CORS_HEADERS },
    )
  }

  const session = await findOrCreateSession({
    chatbotId: chatbot.id,
    sessionUuid,
  })

  await addMessage({
    sessionId: session.id,
    role: 'user',
    content: message.trim(),
  })

  // When session is in HUMAN mode, skip AI — forward message to dashboard operator via Pusher
  if (session.status === 'HUMAN') {
    const workspaceId = chatbot.domain.workspaceId

    await Promise.all([
      pusherServer.trigger(
        PUSHER_CHANNELS.session(session.id),
        PUSHER_EVENTS.NEW_CUSTOMER_MESSAGE,
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: message.trim(),
          createdAt: new Date().toISOString(),
        },
      ),
      pusherServer.trigger(
        PUSHER_CHANNELS.workspace(workspaceId),
        PUSHER_EVENTS.SESSION_UPDATED,
        {
          sessionId: session.id,
          lastMessage: message.trim(),
          status: 'HUMAN',
        },
      ),
    ])

    return Response.json({ ok: true }, { headers: CORS_HEADERS })
  }

  const history = await getSessionMessages({ sessionId: session.id })

  const systemPrompt = buildSystemPrompt(chatbot)

  const workspaceId = chatbot.domain.workspaceId

  const result = streamText({
    model: MODEL,
    system: systemPrompt,
    messages: history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    onFinish: async ({ text }) => {
      await addMessage({
        sessionId: session.id,
        role: 'assistant',
        content: text,
      })

      if (text.includes(REALTIME_MARKER)) {
        await setSessionHuman({ sessionId: session.id })

        // Notify widget that session switched to HUMAN
        await pusherServer.trigger(
          PUSHER_CHANNELS.chatSession(sessionUuid),
          PUSHER_EVENTS.STATUS_CHANGED,
          { status: 'HUMAN' },
        )

        // Notify dashboard of escalation
        await pusherServer.trigger(
          PUSHER_CHANNELS.workspace(workspaceId),
          PUSHER_EVENTS.SESSION_ESCALATED,
          {
            sessionId: session.id,
            sessionUuid,
            domainHostname: chatbot.domain.hostname,
          },
        )
      } else if (text.includes(PORTAL_MARKER)) {
        // Parse answers that the AI embedded inline in the same response
        if (chatbot.questions.length > 0) {
          const answers = parseAnswersFromText(text)

          if (Object.keys(answers).length > 0) {
            await setSessionAnswers({ sessionId: session.id, answers })
          }
        }

        await generatePortalToken({ sessionId: session.id })
      }
    },
  })

  return result.toTextStreamResponse({ headers: CORS_HEADERS })
}

// Ensure OPENAI_API_KEY is accessible at module load time
void env.OPENAI_API_KEY
