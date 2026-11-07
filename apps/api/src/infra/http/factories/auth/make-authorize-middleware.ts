import type { Action } from '@vitrine-academica/permissions'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { makeAuthorizeHandler } from '../../middlewares/authorize'

export function makeAuthorizeMiddleware(action: Action, subject: 'Analytics') {
  const usersRepository = new DrizzleUsersRepository(db)

  return makeAuthorizeHandler(usersRepository, action, subject)
}
