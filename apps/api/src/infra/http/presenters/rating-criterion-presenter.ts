import type { RatingCriterion } from '@/domain/project/enterprise/entities/rating-criterion'

export class RatingCriterionPresenter {
  static toHTTP(criterion: RatingCriterion) {
    return {
      id: criterion.id.toString(),
      name: criterion.name,
      description: criterion.description ?? null,
      weight: criterion.weight,
      active: criterion.active,
      validFrom: criterion.validFrom.toISOString(),
      validUntil: criterion.validUntil?.toISOString() ?? null,
      createdAt: criterion.createdAt.toISOString(),
    }
  }
}
