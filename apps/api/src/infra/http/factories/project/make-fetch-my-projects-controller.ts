import { FetchMyProjectsUseCase } from '@/domain/project/application/use-cases/project/fetch-my-projects'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectMembersRepository } from '@/infra/database/repositories/drizzle-project-members-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { FetchMyProjectsController } from '../../controllers/project/fetch-my-projects.controller'

export function makeFetchMyProjectsController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectMembersRepository = new DrizzleProjectMembersRepository(db)
  const fetchMyProjectsUseCase = new FetchMyProjectsUseCase(projectsRepository, projectMembersRepository)

  return new FetchMyProjectsController(fetchMyProjectsUseCase)
}
