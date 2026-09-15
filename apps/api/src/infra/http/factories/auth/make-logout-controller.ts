import { LogoutUseCase } from '@/domain/identity/application/use-cases/auth/logout'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleSessionsRepository } from '@/infra/database/repositories/drizzle-sessions-repository'
import { LogoutController } from '../../controllers/auth/logout.controller'

export function makeLogoutController() {
  const sessionsRepository = new DrizzleSessionsRepository(db)
  const logoutUseCase = new LogoutUseCase(sessionsRepository)

  return new LogoutController(logoutUseCase)
}
