import { GetProjectRatingsUseCase } from '@/domain/project/application/use-cases/project-star/get-project-ratings'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectStarsRepository } from '@/infra/database/repositories/drizzle-project-stars-repository'
import { DrizzleProjectTeacherRatingsRepository } from '@/infra/database/repositories/drizzle-project-teacher-ratings-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { GetProjectRatingsController } from '../../controllers/project/get-project-ratings.controller'

export function makeGetProjectRatingsController() {
  const getProjectRatingsUseCase = new GetProjectRatingsUseCase(
    new DrizzleProjectsRepository(db),
    new DrizzleProjectStarsRepository(db),
    new DrizzleProjectTeacherRatingsRepository(db),
  )

  return new GetProjectRatingsController(getProjectRatingsUseCase)
}
