import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RatingCriterion } from '@/domain/project/enterprise/entities/rating-criterion'
import type { ratingCriteria } from '../schemas/rating-criteria'

type DrizzleRatingCriterion = typeof ratingCriteria.$inferSelect
type DrizzleRatingCriterionInsert = typeof ratingCriteria.$inferInsert

export class DrizzleRatingCriterionMapper {
  static toDomain(row: DrizzleRatingCriterion): RatingCriterion {
    return RatingCriterion.create(
      {
        name: row.name,
        description: row.description,
        weight: row.weight,
        active: row.active,
        validFrom: row.validFrom,
        validUntil: row.validUntil,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(entity: RatingCriterion): DrizzleRatingCriterionInsert {
    return {
      id: entity.id.toString(),
      name: entity.name,
      description: entity.description ?? null,
      weight: entity.weight,
      active: entity.active,
      validFrom: entity.validFrom,
      validUntil: entity.validUntil ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt ?? undefined,
    }
  }
}
