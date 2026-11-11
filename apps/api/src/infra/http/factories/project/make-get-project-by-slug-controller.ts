import { GetProjectBySlugUseCase } from '@/domain/project/application/use-cases/project/get-project-by-slug'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { GetProjectBySlugController } from '../../controllers/project/get-project-by-slug.controller'
import { DrizzleProjectMembersRepository } from '@/infra/database/repositories/drizzle-project-members-repository'

export function makeGetProjectBySlugController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectMembersRepository = new DrizzleProjectMembersRepository(db)
  const getProjectBySlugUseCase = new GetProjectBySlugUseCase(projectsRepository, projectMembersRepository)

  return new GetProjectBySlugController(getProjectBySlugUseCase)
}
