import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { UpdateCallUseCase } from '@/domain/call/application/use-cases/call/update-call'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleCallSkillsRepository } from '@/infra/database/repositories/drizzle-call-skills-repository'
import { DrizzleCallsRepository } from '@/infra/database/repositories/drizzle-calls-repository'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { UpdateCallController } from '../../controllers/call/update-call.controller'

export function makeUpdateCallController() {
  const callsRepository = new DrizzleCallsRepository(db)
  const callSkillsRepository = new DrizzleCallSkillsRepository(db)
  const tagsRepository = new DrizzleTagsRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const updateCallUseCase = new UpdateCallUseCase(
    callsRepository,
    callSkillsRepository,
    tagsRepository,
    registerLogUseCase,
  )

  return new UpdateCallController(updateCallUseCase)
}
