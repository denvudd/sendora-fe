import type { Chatbot, ChatbotQuestion, Domain } from '@prisma/client'

import { openai } from '@ai-sdk/openai'
import { ChatbotBorderRadius } from '@prisma/client'

export const MODEL = openai('gpt-4o-mini')

export const BORDER_RADIUS_CLASS: Record<ChatbotBorderRadius, string> = {
  [ChatbotBorderRadius.NONE]: 'rounded-none',
  [ChatbotBorderRadius.SMALL]: 'rounded-lg',
  [ChatbotBorderRadius.MEDIUM]: 'rounded-2xl',
  [ChatbotBorderRadius.LARGE]: 'rounded-3xl',
  [ChatbotBorderRadius.FULL]: 'rounded-[2rem]',
}

export const MAX_GUIDING_QUESTIONS = 10

export const PORTAL_MARKER = JSON.stringify({ portal: true })
export const REALTIME_MARKER = JSON.stringify({ realtime: true })

/** Strips all AI-appended JSON markers from message content. */
export function stripMarkers(content: string): string {
  return content
    .replace(/\n?\{"realtime":true\}\s*$/, '')
    .replace(/\n?\{"portal":true\}\s*$/, '')
    .replace(/\n?\{"answers":\{[\s\S]*?\}\}\s*/g, '')
    .trim()
}

/**
 * Parses inline answers JSON written by the AI directly into the response text.
 * Expected format (on a line just before the portal marker):
 *   `{"answers":{"<questionId>":"<answer>", ...}}`
 * Returns a map of questionId → answer, or an empty object if not found / invalid.
 */
export function parseAnswersFromText(text: string): Record<string, string> {
  // Find the start of the answers object
  const start = text.indexOf('{"answers":')

  if (start === -1) {
    return {}
  }

  // Find the matching closing braces by counting depth
  let depth = 0
  let end = -1

  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') {
      depth++
    } else if (text[i] === '}') {
      depth--

      if (depth === 0) {
        end = i
        break
      }
    }
  }

  if (end === -1) {
    return {}
  }

  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1))

    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      'answers' in parsed &&
      typeof (parsed as Record<string, unknown>).answers === 'object' &&
      (parsed as Record<string, unknown>).answers !== null
    ) {
      return (parsed as { answers: Record<string, string> }).answers
    }
  } catch {
    // ignore malformed JSON
  }

  return {}
}

/** Returns true when a message contained the realtime handoff marker. */
export function containsRealtimeMarker(content: string): boolean {
  return content.includes(REALTIME_MARKER)
}

/** Returns true when a message contained the portal marker. */
export function containsPortalMarker(content: string): boolean {
  return content.includes(PORTAL_MARKER)
}

const LANGUAGE_PART = `LANGUAGE:
- Detect the language the visitor is writing in and always respond in that same language.
- This rule overrides the language of the persona, welcome message, or guiding questions — if the visitor writes in Ukrainian, respond in Ukrainian; if in English, respond in English; etc.
- If the visitor switches language mid-conversation, follow their lead immediately.`

const COMMUNICATION_STYLE_PART = `COMMUNICATION STYLE:
- Be natural, friendly, and concise
- Keep messages short — avoid long paragraphs
- Ask only one question per message
- Never ask the visitor for their name, email, or phone — those are collected in the booking portal`

const ACCURACY_PART = `ACCURACY:
- Do NOT invent prices, policies, or features not mentioned in your persona
- If unsure about something, say you will clarify, rather than guessing`

const SCOPE_PART = `SCOPE:
You may only discuss topics directly related to this business. If the visitor asks about anything unrelated (coding help, general knowledge, personal questions, etc.) politely decline and redirect them to the booking goal.`

const REALTIME_PART = `HUMAN HANDOFF:
If one of the scenarios below happens:
1. The visitor explicitly asks to speak with a real person (e.g. "I want to talk to a human", "connect me with someone")
2. You think the request is beyond your scope (e.g. "I want to book a meeting with John Doe", "I need help with my account")
Then do the following:
- End your response with this EXACT JSON on a new line:
${REALTIME_MARKER}

Rules:
- Do NOT add anything after the JSON
- Only trigger on an explicit request for a human — not on frustration alone`

const PORTAL_TRIGGER_PART = `BOOKING PORTAL TRIGGER:
When you are ready to send the visitor to the booking portal, end your response with TWO JSON lines:
1. The collected answers (if any guiding questions were asked)
2. The portal marker

Rules:
- Do NOT add anything after the JSON lines
- Do NOT explain the JSON
- Send them exactly once at the right moment (see your flow below)
- If no guiding questions were asked, output only the portal marker line`

// Flow when guiding questions exist
function withQuestionsFlow(
  persona: string,
  welcomeMessage: string,
  questions: ChatbotQuestion[],
): string {
  const questionList = questions
    .map((q, i) => `${i + 1}. [id: "${q.id}"] ${q.text}`)
    .join('\n')

  const answersJsonExample = questions
    .map(q => `"${q.id}": "visitor answer"`)
    .join(', ')

  return `ROLE & PERSONA:
${persona}

YOUR ONLY GOAL: collect the visitor's answers to all the guiding questions below, then send them to the booking portal.

CONVERSATION FLOW:
1. Greet the visitor with: "${welcomeMessage}"
2. BEFORE asking any question — scan ALL existing messages in the conversation for answers.
   A visitor may answer one or several questions proactively in their very first message, even before you asked.
   Use semantic understanding: if the visitor says "I'm in Ukraine on vacation", that answers both a country question and a purpose question.
   - If ALL questions are already answered → trigger the booking portal immediately in your very next reply, without asking anything.
   - If SOME questions are answered → skip those and ask only the remaining ones, one at a time.
3. Ask only unanswered questions, ONE AT A TIME, naturally woven into conversation.
4. Once the visitor has answered ALL questions — trigger the booking portal immediately.

GUIDING QUESTIONS (you must collect answers to all of them):
${questionList}

WHEN TRIGGERING THE PORTAL — output these TWO lines at the end of your response (nothing after them):
{"answers":{${answersJsonExample}}}
${PORTAL_MARKER}

Replace each "visitor answer" with the actual verbatim or brief answer the visitor gave.

IMPORTANT:
- Ask each question at most once
- Do not repeat a question the visitor has already answered — even if they answered it without being asked
- Do not trigger the booking portal until EVERY question on the list has been answered
- Once all questions are answered, trigger the portal in the very next response — do not add extra chat
- The answers JSON must use the exact question IDs shown above (the values in double quotes after "id:")`
}

// Flow when there are no guiding questions
function noQuestionsFlow(persona: string, welcomeMessage: string): string {
  return `ROLE & PERSONA:
${persona}

YOUR ONLY GOAL: briefly introduce yourself and the business, then send the visitor to the booking portal.

CONVERSATION FLOW:
1. Greet the visitor with: "${welcomeMessage}"
2. In 1–2 short messages, introduce yourself and explain what value the meeting will bring.
3. Offer to schedule a meeting. If user agrees (e.g. "Yes, let's schedule a meeting", "I'd like to book a meeting" or other positive response), trigger the booking portal.

IMPORTANT:
- Do not drag out the conversation
- Trigger the booking portal as soon as the visitor shows any interest in a meeting or after your brief introduction`
}

type ChatbotWithQuestions = Chatbot & {
  questions: ChatbotQuestion[]
  domain: Pick<Domain, 'hostname' | 'isVerified'>
}

export function buildSystemPrompt(chatbot: ChatbotWithQuestions): string {
  const persona = chatbot.systemPrompt?.trim()
    ? chatbot.systemPrompt.trim()
    : `You are a helpful assistant for the business at ${chatbot.domain.hostname}.`

  const flowPart =
    chatbot.questions.length > 0
      ? withQuestionsFlow(persona, chatbot.welcomeMessage, chatbot.questions)
      : noQuestionsFlow(persona, chatbot.welcomeMessage)

  return [
    flowPart,
    LANGUAGE_PART,
    COMMUNICATION_STYLE_PART,
    ACCURACY_PART,
    SCOPE_PART,
    REALTIME_PART,
    PORTAL_TRIGGER_PART,
  ].join('\n\n')
}
