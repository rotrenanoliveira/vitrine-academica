import { ListProjectTeacherRatingsUseCase } from '@/domain/project/application/use-cases/teacher-rating/list-project-teacher-ratings'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectTeacherRatingsRepository } from '@/infra/database/repositories/drizzle-project-teacher-ratings-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleRatingCriteriaRepository } from '@/infra/database/repositories/drizzle-rating-criteria-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { ListProjectTeacherRatingsController } from '../../controllers/project/list-project-teacher-ratings.controller'

export function makeListProjectTeacherRatingsController() {
  const useCase = new ListProjectTeacherRatingsUseCase(
    new DrizzleProjectsRepository(db),
    new DrizzleProjectTeacherRatingsRepository(db),
    new DrizzleRatingCriteriaRepository(db),
    new DrizzleUsersRepository(db),
  )

  return new ListProjectTeacherRatingsController(useCase)
}
