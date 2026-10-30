import { and, eq, gte, isNull, lte, or } from 'drizzle-orm'
import type { RatingCriteriaRepository } from '@/domain/project/application/repositories/rating-criteria-repository'
import type { RatingCriterion } from '@/domain/project/enterprise/entities/rating-criterion'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleRatingCriterionMapper } from '../drizzle/mappers/drizzle-rating-criterion-mapper'
import { ratingCriteria } from '../drizzle/schemas'

export class DrizzleRatingCriteriaRepository implements RatingCriteriaRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<RatingCriterion | null> {
    const [row] = await this.db.select().from(ratingCriteria).where(eq(ratingCriteria.id, id)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleRatingCriterionMapper.toDomain(row)
  }

  async findActiveValid(at: Date = new Date()): Promise<RatingCriterion[]> {
    const rows = await this.db
      .select()
      .from(ratingCriteria)
      .where(
        and(
          eq(ratingCriteria.active, true),
          lte(ratingCriteria.validFrom, at),
          or(isNull(ratingCriteria.validUntil), gte(ratingCriteria.validUntil, at)),
        ),
      )

    return rows.map(DrizzleRatingCriterionMapper.toDomain)
  }

  async create(criterion: RatingCriterion): Promise<void> {
    await this.db.insert(ratingCriteria).values(DrizzleRatingCriterionMapper.toPersistence(criterion))
  }

  async save(criterion: RatingCriterion): Promise<void> {
    await this.db
      .update(ratingCriteria)
      .set(DrizzleRatingCriterionMapper.toPersistence(criterion))
      .where(eq(ratingCriteria.id, criterion.id.toString()))
  }
}
