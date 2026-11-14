import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { ApplyToCallUseCase } from '@/domain/call/application/use-cases/call-application/apply-to-call'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleCallApplicationsRepository } from '@/infra/database/repositories/drizzle-call-applications-repository'
import { DrizzleCallsRepository } from '@/infra/database/repositories/drizzle-calls-repository'
import { ApplyToCallController } from '../../controllers/call-application/apply-to-call.controller'

export function makeApplyToCallController() {
  const callsRepository = new DrizzleCallsRepository(db)
  const callApplicationsRepository = new DrizzleCallApplicationsRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const applyToCallUseCase = new ApplyToCallUseCase(callsRepository, callApplicationsRepository, registerLogUseCase)

  return new ApplyToCallController(applyToCallUseCase)
}
