import type { RatingCriterion } from '../../enterprise/entities/rating-criterion'

export interface RatingCriteriaRepository {
  findById(id: string): Promise<RatingCriterion | null>
  findActiveValid(at?: Date): Promise<RatingCriterion[]>

  create(criterion: RatingCriterion): Promise<void>
  save(criterion: RatingCriterion): Promise<void>
}
