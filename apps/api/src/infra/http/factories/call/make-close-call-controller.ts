import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { CloseCallUseCase } from '@/domain/call/application/use-cases/call/close-call'
import { CreateProjectFromCallUseCase } from '@/domain/call/application/use-cases/call/create-project-from-call'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleCallApplicationsRepository } from '@/infra/database/repositories/drizzle-call-applications-repository'
import { DrizzleCallProjectCreationRepository } from '@/infra/database/repositories/drizzle-call-project-creation-repository'
import { DrizzleCallSkillsRepository } from '@/infra/database/repositories/drizzle-call-skills-repository'
import { DrizzleCallsRepository } from '@/infra/database/repositories/drizzle-calls-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { CloseCallController } from '../../controllers/call/close-call.controller'

export function makeCloseCallController() {
  const callsRepository = new DrizzleCallsRepository(db)
  const callSkillsRepository = new DrizzleCallSkillsRepository(db)
  const callApplicationsRepository = new DrizzleCallApplicationsRepository(db)
  const projectsRepository = new DrizzleProjectsRepository(db)
  const callProjectCreationRepository = new DrizzleCallProjectCreationRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const createProjectFromCallUseCase = new CreateProjectFromCallUseCase(
    callSkillsRepository,
    callApplicationsRepository,
    projectsRepository,
    callProjectCreationRepository,
    registerLogUseCase,
  )
  const closeCallUseCase = new CloseCallUseCase(callsRepository, createProjectFromCallUseCase, registerLogUseCase)

  return new CloseCallController(closeCallUseCase)
}
