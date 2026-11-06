import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { RemoveProjectTagUseCase } from '@/domain/project/application/use-cases/project-tag/remove-project-tag'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleProjectTagsRepository } from '@/infra/database/repositories/drizzle-project-tags-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { RemoveProjectTagController } from '../../controllers/project-tag/remove-project-tag.controller'

export function makeRemoveProjectTagController() {
  const projectTagsRepository = new DrizzleProjectTagsRepository(db)
  const projectsRepository = new DrizzleProjectsRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLog = new RegisterLogUseCase(auditLogsRepository)

  const removeProjectTagUseCase = new RemoveProjectTagUseCase(projectTagsRepository, projectsRepository, registerLog)

  return new RemoveProjectTagController(removeProjectTagUseCase)
}
