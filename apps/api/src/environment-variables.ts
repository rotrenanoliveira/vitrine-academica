import z from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  //
  COOKIE_SECRET: z.string().min(1),
  // Database
  DATABASE_URL: z.url(),
  // Storage
  CLOUDFLARE_R2_ACCOUNT_ID: z.string(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string(),
  CLOUDFLARE_R2_BUCKET_NAME: z.string(),
  CLOUDFLARE_R2_ASSETS_URL: z.string(),
})

const _env = schema.safeParse(process.env)

if (!_env.success) {
  console.error('Invalid environment variables', _env.error.format())
  process.exit(1)
}

export const env = _env.data
