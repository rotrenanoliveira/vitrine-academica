import type { Promotion } from '@/domain/points/enterprise/entities/promotion'

export class PromotionPresenter {
  static toHTTP(promotion: Promotion) {
    return {
      id: promotion.id.toString(),
      projectId: promotion.projectId.toString(),
      promoterId: promotion.promoterId.toString(),
      cost: promotion.cost,
      status: promotion.status,
      expiresAt: promotion.expiresAt.toISOString(),
      createdAt: promotion.createdAt.toISOString(),
    }
  }
}
