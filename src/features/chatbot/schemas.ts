import { z } from 'zod'

import { HEX_REGEX } from '@/shared/constants/regex'

export const chatbotSettingsSchema = z.object({
  welcomeMessage: z
    .string()
    .trim()
    .min(1, 'Welcome message is required.')
    .max(300, 'Max 300 characters.'),
  primaryColor: z
    .string()
    .trim()
    .regex(HEX_REGEX, 'Enter a valid hex color (e.g. #6366f1).')
    .optional()
    .or(z.literal('')),
  buttonStyle: z.enum(['BUBBLE', 'BAR']),
  borderRadius: z.enum(['NONE', 'SMALL', 'MEDIUM', 'LARGE', 'FULL']).optional(),
  theme: z.enum(['LIGHT', 'DARK']).optional(),
  chatTitle: z
    .string()
    .trim()
    .min(1, 'Chat title is required.')
    .max(60, 'Max 60 characters.')
    .optional(),
  chatSubtitle: z
    .string()
    .trim()
    .max(80, 'Max 80 characters.')
    .optional()
    .or(z.literal('')),
  systemPrompt: z
    .string()
    .trim()
    .max(2000, 'Max 2000 characters.')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional(),
})

export const chatbotQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        text: z
          .string()
          .trim()
          .min(1, 'Question cannot be empty.')
          .max(200, 'Max 200 characters.'),
      }),
    )
    .max(10, 'Maximum 10 guiding questions.'),
})

export type ChatbotSettingsInput = z.infer<typeof chatbotSettingsSchema>
export type ChatbotQuestionsInput = z.infer<typeof chatbotQuestionsSchema>
