import { HOSTNAME_REGEX } from '@shared/constants/regex'
import { z } from 'zod'

export const createDomainSchema = z.object({
  hostname: z
    .string()
    .trim()
    .min(1, 'Hostname is required.')
    .regex(HOSTNAME_REGEX, 'Enter a valid hostname (e.g. example.com).'),
})

export const updateDomainSchema = z.object({
  hostname: z
    .string()
    .trim()
    .min(1, 'Hostname is required.')
    .regex(HOSTNAME_REGEX, 'Enter a valid hostname (e.g. example.com).'),
  iconUrl: z.string().url('Invalid icon URL.').optional().or(z.literal('')),
})
