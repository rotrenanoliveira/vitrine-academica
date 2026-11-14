import { GetMyStarOnProjectUseCase } from '@/domain/project/application/use-cases/project-star/get-my-star-on-project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectStarsRepository } from '@/infra/database/repositories/drizzle-project-stars-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { GetMyStarOnProjectController } from '../../controllers/project/get-my-star-on-project.controller'

export function makeGetMyStarOnProjectController() {
  const getMyStarOnProjectUseCase = new GetMyStarOnProjectUseCase(
    new DrizzleProjectsRepository(db),
    new DrizzleProjectStarsRepository(db),
  )

  return new GetMyStarOnProjectController(getMyStarOnProjectUseCase)
}
