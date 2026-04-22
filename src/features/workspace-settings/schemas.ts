import { z } from 'zod'

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters.')
    .trim(),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters.')
    .max(48, 'Slug must be 48 characters or fewer.')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug may only contain lowercase letters, numbers, and hyphens.',
    )
    .trim(),
  logoUrl: z.string().url('Invalid logo URL.').optional(),
})
