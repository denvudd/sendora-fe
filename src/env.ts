import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  client: {
    NEXT_PUBLIC_APP_URL: z.url().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
  server: {
    DATABASE_URL: z.url(),
    DIRECT_URL: z.url(),
    NODE_ENV: z.enum(['development', 'test', 'production']),
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
