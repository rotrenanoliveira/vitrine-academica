import type {
  CreatePromotionWithDebitResult,
  PromotionsRepository,
} from '@/domain/points/application/repositories/promotions-repository'
import type { PointTransaction } from '@/domain/points/enterprise/entities/point-transaction'
import { type Promotion, PromotionStatus } from '@/domain/points/enterprise/entities/promotion'
import type { InMemoryPointTransactionsRepository } from './in-memory-point-transactions-repository'

export class InMemoryPromotionsRepository implements PromotionsRepository {
  public items: Promotion[] = []

  constructor(private readonly pointTransactionsRepository: InMemoryPointTransactionsRepository) {}

  async createWithDebit(promotion: Promotion, debit: PointTransaction): Promise<CreatePromotionWithDebitResult> {
    const alreadyPromoted = this.items.some(
      (item) =>
        item.projectId.toString() === promotion.projectId.toString() &&
        item.promoterId.toString() === promotion.promoterId.toString() &&
        item.isActive(promotion.createdAt),
    )

    if (alreadyPromoted) {
      return { status: 'ALREADY_PROMOTED' }
    }

    const balance = await this.pointTransactionsRepository.getBalanceByUserId(debit.userId.toString())

    if (balance < debit.amount) {
      return { status: 'INSUFFICIENT_BALANCE', balance }
    }

    this.items.push(promotion)
    await this.pointTransactionsRepository.create(debit)

    return { status: 'CREATED' }
  }

  async findManyActive(now: Date): Promise<Promotion[]> {
    return this.items.filter((item) => item.isActive(now)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async findActiveProjectIds(projectIds: string[], now: Date): Promise<string[]> {
    const wanted = new Set(projectIds)

    const ids = this.items
      .filter((item) => wanted.has(item.projectId.toString()) && item.isActive(now))
      .map((item) => item.projectId.toString())

    return [...new Set(ids)]
  }

  async findManyDueForExpiration(now: Date): Promise<Promotion[]> {
    return this.items
      .filter((item) => item.status === PromotionStatus.ACTIVE && item.expiresAt.getTime() <= now.getTime())
      .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())
  }

  async tryExpire(promotionId: string, now: Date): Promise<boolean> {
    const item = this.items.find(
      (promotion) =>
        promotion.id.toString() === promotionId &&
        promotion.status === PromotionStatus.ACTIVE &&
        promotion.expiresAt.getTime() <= now.getTime(),
    )

    if (!item) {
      return false
    }

    item.expire()

    return true
  }
}
