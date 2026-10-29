import { ListMyStarredProjectsUseCase } from '@/domain/project/application/use-cases/project-star/list-my-starred-projects'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectStarsRepository } from '@/infra/database/repositories/drizzle-project-stars-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { ListMyStarredProjectsController } from '../../controllers/project/list-my-starred-projects.controller'

export function makeListMyStarredProjectsController() {
  const listMyStarredProjectsUseCase = new ListMyStarredProjectsUseCase(
    new DrizzleProjectsRepository(db),
    new DrizzleProjectStarsRepository(db),
  )

  return new ListMyStarredProjectsController(listMyStarredProjectsUseCase)
}
