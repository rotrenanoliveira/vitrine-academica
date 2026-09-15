import { FetchMyProjectsUseCase } from '@/domain/project/application/use-cases/project/fetch-my-projects'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { FetchMyProjectsController } from '../../controllers/project/fetch-my-projects.controller'

export function makeFetchMyProjectsController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const fetchMyProjectsUseCase = new FetchMyProjectsUseCase(projectsRepository)

  return new FetchMyProjectsController(fetchMyProjectsUseCase)
}
