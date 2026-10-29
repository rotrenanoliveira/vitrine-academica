import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { UnstarProjectUseCase } from '@/domain/project/application/use-cases/project-star/unstar-project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleProjectStarsRepository } from '@/infra/database/repositories/drizzle-project-stars-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { UnstarProjectController } from '../../controllers/project/unstar-project.controller'

export function makeUnstarProjectController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectStarsRepository = new DrizzleProjectStarsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(new DrizzleAuditLogsRepository(db))

  const unstarProjectUseCase = new UnstarProjectUseCase(projectsRepository, projectStarsRepository, registerLogUseCase)

  return new UnstarProjectController(unstarProjectUseCase)
}
