import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { PublishScheduledProjectsUseCase } from '@/domain/project/application/use-cases/scheduled-project/publish-scheduled-projects'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleProjectScheduledRepository } from '@/infra/database/repositories/drizzle-project-scheduled-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { PublishScheduledProjectsController } from '../../controllers/project/publish-scheduled-projects.controller'

export function makePublishScheduledProjectsController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectScheduledRepository = new DrizzleProjectScheduledRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLog = new RegisterLogUseCase(auditLogsRepository)

  const publishScheduledProjectsUseCase = new PublishScheduledProjectsUseCase(
    projectsRepository,
    projectScheduledRepository,
    registerLog,
  )

  return new PublishScheduledProjectsController(publishScheduledProjectsUseCase)
}
