import { type Either, right } from '@/core/either'
import type { RatingCriterion } from '../../../enterprise/entities/rating-criterion'
import type { RatingCriteriaRepository } from '../../repositories/rating-criteria-repository'

type ListActiveRatingCriteriaUseCaseResponse = Either<never, { criteria: RatingCriterion[] }>

export class ListActiveRatingCriteriaUseCase {
  constructor(private readonly ratingCriteriaRepository: RatingCriteriaRepository) {}

  async execute(): Promise<ListActiveRatingCriteriaUseCaseResponse> {
    const criteria = await this.ratingCriteriaRepository.findActiveValid()

    return right({ criteria })
  }
}
