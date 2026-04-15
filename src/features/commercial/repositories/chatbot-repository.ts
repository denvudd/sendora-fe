import type {
  ChatbotBorderRadius,
  ChatbotButtonStyle,
  ChatbotTheme,
} from '@prisma/client'

import { prisma } from '@shared/utils/prisma'

interface CreateChatbotParams {
  domainId: string
  welcomeMessage?: string
  primaryColor?: string
  buttonStyle?: ChatbotButtonStyle
  borderRadius?: ChatbotBorderRadius
  theme?: ChatbotTheme
  chatTitle?: string
  chatSubtitle?: string
  systemPrompt?: string
}

export async function createChatbot({
  domainId,
  welcomeMessage,
  primaryColor,
  buttonStyle,
  borderRadius,
  theme,
  chatTitle,
  chatSubtitle,
  systemPrompt,
}: CreateChatbotParams) {
  return prisma.chatbot.create({
    data: {
      domainId,
      ...(welcomeMessage !== undefined && { welcomeMessage }),
      ...(primaryColor !== undefined && { primaryColor }),
      ...(buttonStyle !== undefined && { buttonStyle }),
      ...(borderRadius !== undefined && { borderRadius }),
      ...(theme !== undefined && { theme }),
      ...(chatTitle !== undefined && { chatTitle }),
      ...(chatSubtitle !== undefined && { chatSubtitle }),
      ...(systemPrompt !== undefined && { systemPrompt }),
    },
    include: {
      questions: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

interface FindChatbotByDomainIdParams {
  domainId: string
}

export async function findChatbotByDomainId({
  domainId,
}: FindChatbotByDomainIdParams) {
  return prisma.chatbot.findUnique({
    where: { domainId },
    include: {
      questions: { orderBy: { sortOrder: 'asc' } },
      domain: {
        select: {
          hostname: true,
          isVerified: true,
          workspaceId: true,
        },
      },
    },
  })
}

export async function findChatbotWithPlanByDomainId({
  domainId,
}: FindChatbotByDomainIdParams) {
  return prisma.chatbot.findUnique({
    where: { domainId },
    include: {
      questions: { orderBy: { sortOrder: 'asc' } },
      domain: {
        select: {
          id: true,
          hostname: true,
          isVerified: true,
          verificationToken: true,
          lastVerifiedCheckAt: true,
          workspace: {
            select: {
              subscriptions: {
                where: { status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
                include: { plan: { select: { code: true } } },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  })
}

interface FindChatbotByIdPublicParams {
  chatbotId: string
}

export async function findChatbotByIdPublic({
  chatbotId,
}: FindChatbotByIdPublicParams) {
  return prisma.chatbot.findUnique({
    where: { id: chatbotId },
    include: {
      domain: { select: { hostname: true } },
      questions: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

interface UpdateChatbotParams {
  chatbotId: string
  domainId: string
  welcomeMessage?: string
  primaryColor?: string
  buttonStyle?: ChatbotButtonStyle
  borderRadius?: ChatbotBorderRadius
  theme?: ChatbotTheme
  chatTitle?: string
  chatSubtitle?: string
  systemPrompt?: string
  isActive?: boolean
}

export async function updateChatbot({
  chatbotId,
  domainId,
  welcomeMessage,
  primaryColor,
  buttonStyle,
  borderRadius,
  theme,
  chatTitle,
  chatSubtitle,
  systemPrompt,
  isActive,
}: UpdateChatbotParams) {
  return prisma.chatbot.update({
    where: { id: chatbotId, domainId },
    data: {
      ...(welcomeMessage !== undefined && { welcomeMessage }),
      ...(primaryColor !== undefined && { primaryColor }),
      ...(buttonStyle !== undefined && { buttonStyle }),
      ...(borderRadius !== undefined && { borderRadius }),
      ...(theme !== undefined && { theme }),
      ...(chatTitle !== undefined && { chatTitle }),
      ...(chatSubtitle !== undefined && { chatSubtitle }),
      ...(systemPrompt !== undefined && { systemPrompt }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { questions: { orderBy: { sortOrder: 'asc' } } },
  })
}

// --- Questions ---

interface ReplaceQuestionsParams {
  chatbotId: string
  questions: Array<{ text: string; sortOrder: number }>
}

export async function replaceQuestions({
  chatbotId,
  questions,
}: ReplaceQuestionsParams) {
  return prisma.$transaction([
    prisma.chatbotQuestion.deleteMany({ where: { chatbotId } }),
    prisma.chatbotQuestion.createMany({
      data: questions.map(q => ({
        chatbotId,
        text: q.text,
        sortOrder: q.sortOrder,
      })),
    }),
  ])
}

// --- Chat Sessions ---

interface FindOrCreateSessionParams {
  chatbotId: string
  sessionUuid: string
}

export async function findOrCreateSession({
  chatbotId,
  sessionUuid,
}: FindOrCreateSessionParams) {
  return prisma.chatSession.upsert({
    where: { sessionUuid },
    create: { chatbotId, sessionUuid },
    update: {},
  })
}

interface AddMessageParams {
  sessionId: string
  role: 'user' | 'assistant'
  content: string
}

export async function addMessage({
  sessionId,
  role,
  content,
}: AddMessageParams) {
  return prisma.chatMessage.create({
    data: { sessionId, role, content },
  })
}

interface GetSessionMessagesParams {
  sessionId: string
}

export async function getSessionMessages({
  sessionId,
}: GetSessionMessagesParams) {
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  })
}

interface SetSessionHumanParams {
  sessionId: string
}

export async function setSessionHuman({ sessionId }: SetSessionHumanParams) {
  return prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: 'HUMAN' },
  })
}

interface GeneratePortalTokenParams {
  sessionId: string
}

export async function generatePortalToken({
  sessionId,
}: GeneratePortalTokenParams) {
  const token = crypto.randomUUID()

  return prisma.chatSession.update({
    where: { id: sessionId },
    data: { portalToken: token, status: 'HUMAN' },
  })
}

interface FindSessionByUuidParams {
  sessionUuid: string
}

export async function findSessionByUuid({
  sessionUuid,
}: FindSessionByUuidParams) {
  return prisma.chatSession.findUnique({
    where: { sessionUuid },
    select: { id: true, portalToken: true, status: true },
  })
}

interface FindSessionByPortalTokenParams {
  portalToken: string
}

export async function findSessionByPortalToken({
  portalToken,
}: FindSessionByPortalTokenParams) {
  return prisma.chatSession.findUnique({
    where: { portalToken },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      chatbot: {
        include: {
          questions: { orderBy: { sortOrder: 'asc' } },
          domain: {
            include: {
              workspace: {
                include: {
                  appointmentSchedule: true,
                  subscriptions: {
                    where: {
                      status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
                    },
                    include: { plan: { select: { code: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  })
}

// --- Dashboard / Conversations ---

interface FindSessionsByWorkspaceIdParams {
  workspaceId: string
}

export async function findSessionsByWorkspaceId({
  workspaceId,
}: FindSessionsByWorkspaceIdParams) {
  return prisma.chatSession.findMany({
    where: {
      chatbot: { domain: { workspaceId } },
    },
    include: {
      chatbot: {
        select: {
          domain: { select: { hostname: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

interface FindSessionWithMessagesParams {
  sessionId: string
  workspaceId: string
}

export async function findSessionWithMessages({
  sessionId,
  workspaceId,
}: FindSessionWithMessagesParams) {
  return prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      chatbot: { domain: { workspaceId } },
    },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      chatbot: {
        select: {
          domain: { select: { hostname: true } },
        },
      },
    },
  })
}

interface SetSessionHumanBySessionIdParams {
  sessionId: string
}

/** Sets session status to HUMAN and returns sessionUuid + workspaceId for Pusher events. */
export async function setSessionHumanBySessionId({
  sessionId,
}: SetSessionHumanBySessionIdParams) {
  return prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: 'HUMAN' },
    select: {
      id: true,
      sessionUuid: true,
      status: true,
      chatbot: {
        select: {
          domain: { select: { workspaceId: true, hostname: true } },
        },
      },
    },
  })
}

interface CloseSessionParams {
  sessionId: string
}

/** Sets session status to CLOSED and returns sessionUuid + workspaceId for Pusher events. */
export async function closeSession({ sessionId }: CloseSessionParams) {
  return prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: 'CLOSED' },
    select: {
      id: true,
      sessionUuid: true,
      status: true,
      chatbot: {
        select: {
          domain: { select: { workspaceId: true, hostname: true } },
        },
      },
    },
  })
}
