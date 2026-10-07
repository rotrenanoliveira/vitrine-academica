import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { RegisterProjectTagUseCase } from '@/domain/project/application/use-cases/project-tag/register-project-tag'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleProjectTagsRepository } from '@/infra/database/repositories/drizzle-project-tags-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { RegisterProjectTagController } from '../../controllers/project-tag/register-project-tag.controller'

export function makeRegisterProjectTagController() {
  const projectTagsRepository = new DrizzleProjectTagsRepository(db)
  const projectsRepository = new DrizzleProjectsRepository(db)
  const tagsRepository = new DrizzleTagsRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLog = new RegisterLogUseCase(auditLogsRepository)

  const registerProjectTagUseCase = new RegisterProjectTagUseCase(
    projectTagsRepository,
    projectsRepository,
    tagsRepository,
    registerLog,
  )

  return new RegisterProjectTagController(registerProjectTagUseCase)
}
