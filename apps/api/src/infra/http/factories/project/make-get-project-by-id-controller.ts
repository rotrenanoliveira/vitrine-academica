import { GetProjectByIdUseCase } from '@/domain/project/application/use-cases/project/get-project-by-id'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectMembersRepository } from '@/infra/database/repositories/drizzle-project-members-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { GetProjectByIdController } from '../../controllers/project/get-project-by-id.controller'

export function makeGetProjectByIdController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectMembersRepository = new DrizzleProjectMembersRepository(db)
  const getProjectByIdUseCase = new GetProjectByIdUseCase(projectsRepository, projectMembersRepository)

  return new GetProjectByIdController(getProjectByIdUseCase)
}
