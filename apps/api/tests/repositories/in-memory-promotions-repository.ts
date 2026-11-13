import type {
  CreatePromotionWithDebitResult,
  PromotionsRepository,
} from '@/domain/points/application/repositories/promotions-repository'
import type { PointTransaction } from '@/domain/points/enterprise/entities/point-transaction'
import type { Promotion } from '@/domain/points/enterprise/entities/promotion'
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
}
