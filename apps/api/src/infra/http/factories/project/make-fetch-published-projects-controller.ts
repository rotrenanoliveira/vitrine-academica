import { GetFeaturedProjectIdsUseCase } from '@/domain/points/application/use-cases/promotion/get-featured-project-ids'
import { FetchPublishedProjectsUseCase } from '@/domain/project/application/use-cases/fetch-published-projects'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzlePromotionsRepository } from '@/infra/database/repositories/drizzle-promotions-repository'
import { FetchPublishedProjectsController } from '../../controllers/project/fetch-published-projects.controller'

export function makeFetchPublishedProjectsController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const fetchPublishedProjectsUseCase = new FetchPublishedProjectsUseCase(projectsRepository)
  const getFeaturedProjectIdsUseCase = new GetFeaturedProjectIdsUseCase(new DrizzlePromotionsRepository(db))

  return new FetchPublishedProjectsController(fetchPublishedProjectsUseCase, getFeaturedProjectIdsUseCase)
}
