import { ListActiveRatingCriteriaUseCase } from '@/domain/project/application/use-cases/teacher-rating/list-active-rating-criteria'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleRatingCriteriaRepository } from '@/infra/database/repositories/drizzle-rating-criteria-repository'
import { ListActiveRatingCriteriaController } from '../../controllers/project/list-active-rating-criteria.controller'

export function makeListActiveRatingCriteriaController() {
  const useCase = new ListActiveRatingCriteriaUseCase(new DrizzleRatingCriteriaRepository(db))

  return new ListActiveRatingCriteriaController(useCase)
}
