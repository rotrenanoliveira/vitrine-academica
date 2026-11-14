import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { RegisterProjectUseCase } from '@/domain/project/application/use-cases/project/register-project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleProjectTagsRepository } from '@/infra/database/repositories/drizzle-project-tags-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { RegisterProjectController } from '../../controllers/project/register-project.controller'

export function makeRegisterProjectController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectTagsRepository = new DrizzleProjectTagsRepository(db)
  const tagsRepository = new DrizzleTagsRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const registerProjectUseCase = new RegisterProjectUseCase(
    projectsRepository,
    projectTagsRepository,
    tagsRepository,
    registerLogUseCase,
  )

  return new RegisterProjectController(registerProjectUseCase)
}
