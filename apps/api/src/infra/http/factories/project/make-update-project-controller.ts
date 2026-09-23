import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { UpdateProjectUseCase } from '@/domain/project/application/use-cases/project/update-project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { UpdateProjectController } from '../../controllers/project/update-project.controller'

export function makeUpdateProjectController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const updateProjectUseCase = new UpdateProjectUseCase(projectsRepository, registerLogUseCase)

  return new UpdateProjectController(updateProjectUseCase)
}
