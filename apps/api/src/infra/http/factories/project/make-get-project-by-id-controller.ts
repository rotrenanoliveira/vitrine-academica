import { GetProjectByIdUseCase } from '@/domain/project/application/use-cases/project/get-project-by-id'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { GetProjectByIdController } from '../../controllers/project/get-project-by-id.controller'

export function makeGetProjectByIdController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const getProjectByIdUseCase = new GetProjectByIdUseCase(projectsRepository)

  return new GetProjectByIdController(getProjectByIdUseCase)
}
