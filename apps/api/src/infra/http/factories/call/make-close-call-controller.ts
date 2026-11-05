import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { CloseCallUseCase } from '@/domain/call/application/use-cases/call/close-call'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleCallsRepository } from '@/infra/database/repositories/drizzle-calls-repository'
import { CloseCallController } from '../../controllers/call/close-call.controller'

export function makeCloseCallController() {
  const callsRepository = new DrizzleCallsRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const closeCallUseCase = new CloseCallUseCase(callsRepository, registerLogUseCase)

  return new CloseCallController(closeCallUseCase)
}
