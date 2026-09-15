import { UpdateProjectUseCase } from '@/domain/project/application/use-cases/project/update-project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { UpdateProjectController } from '../../controllers/project/update-project.controller'

export function makeUpdateProjectController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const updateProjectUseCase = new UpdateProjectUseCase(projectsRepository)

  return new UpdateProjectController(updateProjectUseCase)
}
