import { db } from '@/infra/database/drizzle/client'
import { DrizzleSessionsRepository } from '@/infra/database/repositories/drizzle-sessions-repository'
import { makeAuthenticateHandler } from '../../middlewares/authenticate'

export function makeAuthenticateMiddleware() {
  const sessionsRepository = new DrizzleSessionsRepository(db)

  return makeAuthenticateHandler(sessionsRepository)
}
