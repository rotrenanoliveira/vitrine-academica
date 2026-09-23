import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { LogoutUseCase } from '@/domain/identity/application/use-cases/auth/logout'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleSessionsRepository } from '@/infra/database/repositories/drizzle-sessions-repository'
import { LogoutController } from '../../controllers/auth/logout.controller'

export function makeLogoutController() {
  const sessionsRepository = new DrizzleSessionsRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const logoutUseCase = new LogoutUseCase(sessionsRepository, registerLogUseCase)

  return new LogoutController(logoutUseCase)
}
