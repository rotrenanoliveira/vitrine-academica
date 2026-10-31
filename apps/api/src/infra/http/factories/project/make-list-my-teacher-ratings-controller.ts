import { ListMyTeacherRatingsUseCase } from '@/domain/project/application/use-cases/teacher-rating/list-my-teacher-ratings'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectTeacherRatingsRepository } from '@/infra/database/repositories/drizzle-project-teacher-ratings-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { ListMyTeacherRatingsController } from '../../controllers/project/list-my-teacher-ratings.controller'

export function makeListMyTeacherRatingsController() {
  const useCase = new ListMyTeacherRatingsUseCase(
    new DrizzleProjectsRepository(db),
    new DrizzleProjectTeacherRatingsRepository(db),
  )

  return new ListMyTeacherRatingsController(useCase)
}
