import { GetMyTeacherRatingOnProjectUseCase } from '@/domain/project/application/use-cases/teacher-rating/get-my-teacher-rating-on-project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectTeacherRatingsRepository } from '@/infra/database/repositories/drizzle-project-teacher-ratings-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { GetMyTeacherRatingOnProjectController } from '../../controllers/project/get-my-teacher-rating-on-project.controller'

export function makeGetMyTeacherRatingOnProjectController() {
  const useCase = new GetMyTeacherRatingOnProjectUseCase(
    new DrizzleProjectsRepository(db),
    new DrizzleProjectTeacherRatingsRepository(db),
  )

  return new GetMyTeacherRatingOnProjectController(useCase)
}
