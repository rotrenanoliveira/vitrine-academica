import { drizzle } from 'drizzle-orm/node-postgres'
import { env } from '@/environment-variables'

const db = drizzle(env.DATABASE_URL, {
  logger: env.NODE_ENV === 'development',
})

export { db }
