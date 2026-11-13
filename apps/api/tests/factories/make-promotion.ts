import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { PROMOTION_COST, PROMOTION_DURATION_DAYS } from '@/domain/points/application/constants/promotion-rules'
import { Promotion, type PromotionProps } from '@/domain/points/enterprise/entities/promotion'
import { db } from '@/infra/database/drizzle/client'
import { DrizzlePromotionMapper } from '@/infra/database/drizzle/mappers/drizzle-promotion-mapper'
import { promotions } from '@/infra/database/drizzle/schemas'

export function makePromotion(override: Partial<PromotionProps> = {}, id?: UniqueEntityId) {
  const promotion = Promotion.create(
    {
      projectId: new UniqueEntityId(),
      promoterId: new UniqueEntityId(),
      cost: PROMOTION_COST,
      expiresAt: new Date(Date.now() + PROMOTION_DURATION_DAYS * 24 * 60 * 60 * 1000),
      ...override,
    },
    id,
  )

  return { promotion }
}

export async function makePromotionOnDatabase(override: Partial<PromotionProps> = {}, id?: UniqueEntityId) {
  const { promotion } = makePromotion(override, id)

  await db.insert(promotions).values(DrizzlePromotionMapper.toPersistence(promotion))

  return { promotion }
}
