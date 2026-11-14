import { db } from '@/infra/database/drizzle/client'
import { DrizzleSessionsRepository } from '@/infra/database/repositories/drizzle-sessions-repository'
import { makeOptionalAuthenticateHandler } from '../../middlewares/optional-authenticate'

export function makeOptionalAuthenticateMiddleware() {
  const sessionsRepository = new DrizzleSessionsRepository(db)

  return makeOptionalAuthenticateHandler(sessionsRepository)
}
