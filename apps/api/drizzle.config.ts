import { defineConfig } from 'drizzle-kit'
import { env } from './src/environment-variables'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infra/database/drizzle/schemas/index.ts',
  out: './src/infra/database/drizzle/migrations',
  dbCredentials: {
    url: env?.DATABASE_URL ?? '',
  },
})
