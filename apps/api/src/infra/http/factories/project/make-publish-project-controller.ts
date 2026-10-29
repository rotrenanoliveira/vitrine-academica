import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { PublishProjectUseCase } from '@/domain/project/application/use-cases/project/publish-project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleProjectScheduledRepository } from '@/infra/database/repositories/drizzle-project-scheduled-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { PublishProjectController } from '../../controllers/project/publish-project.controller'

export function makePublishProjectController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectScheduledRepository = new DrizzleProjectScheduledRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const publishProjectUseCase = new PublishProjectUseCase(
    projectsRepository,
    projectScheduledRepository,
    registerLogUseCase,
  )

  return new PublishProjectController(publishProjectUseCase)
}
