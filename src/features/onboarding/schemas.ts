import { z } from 'zod'

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required.')
    .max(64, 'First name must be 64 characters or fewer.'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required.')
    .max(64, 'Last name must be 64 characters or fewer.'),
})

/** Client gate: first and last name required before navigating to workspace step. */
export const profileStepNavigationSchema = updateUserSchema.pick({
  firstName: true,
  lastName: true,
})

export const createWorkspaceSchema = z.object({
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
  primaryColor: z
    .string()
    .refine(
      val => !val || /^#[0-9A-Fa-f]{6}$/.test(val),
      'Primary color must be a valid hex color (#RRGGBB).',
    )
    .optional(),
})
