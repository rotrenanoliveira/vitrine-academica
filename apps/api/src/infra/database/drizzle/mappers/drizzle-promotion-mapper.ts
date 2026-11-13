import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Promotion, type PromotionStatus } from '@/domain/points/enterprise/entities/promotion'
import type { promotions } from '../schemas/promotions'

type DrizzlePromotion = typeof promotions.$inferSelect
type DrizzlePromotionInsert = typeof promotions.$inferInsert

export class DrizzlePromotionMapper {
  static toDomain(row: DrizzlePromotion): Promotion {
    return Promotion.create(
      {
        projectId: new UniqueEntityId(row.projectId),
        promoterId: new UniqueEntityId(row.promoterId),
        cost: row.cost,
        status: row.status as PromotionStatus,
        expiresAt: row.expiresAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(entity: Promotion): DrizzlePromotionInsert {
    return {
      id: entity.id.toString(),
      projectId: entity.projectId.toString(),
      promoterId: entity.promoterId.toString(),
      cost: entity.cost,
      status: entity.status,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt ?? undefined,
    }
  }
}
