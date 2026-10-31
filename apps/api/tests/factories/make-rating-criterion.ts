import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RatingCriterion, type RatingCriterionProps } from '@/domain/project/enterprise/entities/rating-criterion'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleRatingCriteriaRepository } from '@/infra/database/repositories/drizzle-rating-criteria-repository'

export function makeRatingCriterion(override: Partial<RatingCriterionProps> = {}, id?: UniqueEntityId) {
  const criterion = RatingCriterion.create(
    {
      name: 'Critério de teste',
      description: 'Descrição do critério de teste',
      weight: 1,
      active: true,
      ...override,
    },
    id,
  )

  return { criterion }
}

export async function makeRatingCriterionOnDatabase(override: Partial<RatingCriterionProps> = {}, id?: UniqueEntityId) {
  const { criterion } = makeRatingCriterion(override, id)

  const repository = new DrizzleRatingCriteriaRepository(db)

  await repository.create(criterion)

  return { criterion }
}
