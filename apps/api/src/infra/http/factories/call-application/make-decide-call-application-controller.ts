import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { DecideCallApplicationUseCase } from '@/domain/call/application/use-cases/call-application/decide-call-application'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleCallApplicationsRepository } from '@/infra/database/repositories/drizzle-call-applications-repository'
import { DrizzleCallsRepository } from '@/infra/database/repositories/drizzle-calls-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { makeEmail } from '@/infra/mail/make-mail'
import { DecideCallApplicationController } from '../../controllers/call-application/decide-call-application.controller'

export function makeDecideCallApplicationController() {
  const callsRepository = new DrizzleCallsRepository(db)
  const callApplicationsRepository = new DrizzleCallApplicationsRepository(db)
  const usersRepository = new DrizzleUsersRepository(db)
  const mail = makeEmail()
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const decideCallApplicationUseCase = new DecideCallApplicationUseCase(
    callsRepository,
    callApplicationsRepository,
    usersRepository,
    mail,
    registerLogUseCase,
  )

  return new DecideCallApplicationController(decideCallApplicationUseCase)
}
