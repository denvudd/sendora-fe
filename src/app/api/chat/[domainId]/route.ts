import type { NextRequest } from 'next/server'

import {
  addMessage,
  findChatbotByDomainId,
  findOrCreateSession,
  getSessionMessages,
} from '@features/commercial/repositories'
import { streamText } from 'ai'

import { env } from '@/env'
import { buildSystemPrompt, MODEL } from '@/features/chatbot/utils'

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

  const history = await getSessionMessages({ sessionId: session.id })

  const systemPrompt = buildSystemPrompt(chatbot)

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
    },
  })

  return result.toTextStreamResponse({ headers: CORS_HEADERS })
}

// Ensure OPENAI_API_KEY is accessible at module load time
void env.OPENAI_API_KEY
