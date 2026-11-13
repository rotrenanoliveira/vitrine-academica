import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { CloseCallUseCase } from '@/domain/call/application/use-cases/call/close-call'
import { CreateProjectFromCallUseCase } from '@/domain/call/application/use-cases/call/create-project-from-call'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleCallApplicationsRepository } from '@/infra/database/repositories/drizzle-call-applications-repository'
import { DrizzleCallSkillsRepository } from '@/infra/database/repositories/drizzle-call-skills-repository'
import { DrizzleCallsRepository } from '@/infra/database/repositories/drizzle-calls-repository'
import { DrizzleProjectMembersRepository } from '@/infra/database/repositories/drizzle-project-members-repository'
import { DrizzleProjectTagsRepository } from '@/infra/database/repositories/drizzle-project-tags-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { CloseCallController } from '../../controllers/call/close-call.controller'

export function makeCloseCallController() {
  const callsRepository = new DrizzleCallsRepository(db)
  const callSkillsRepository = new DrizzleCallSkillsRepository(db)
  const callApplicationsRepository = new DrizzleCallApplicationsRepository(db)
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectTagsRepository = new DrizzleProjectTagsRepository(db)
  const projectMembersRepository = new DrizzleProjectMembersRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const createProjectFromCallUseCase = new CreateProjectFromCallUseCase(
    callsRepository,
    callSkillsRepository,
    callApplicationsRepository,
    projectsRepository,
    projectTagsRepository,
    projectMembersRepository,
    registerLogUseCase,
  )
  const closeCallUseCase = new CloseCallUseCase(callsRepository, createProjectFromCallUseCase, registerLogUseCase)

  return new CloseCallController(closeCallUseCase)
}
