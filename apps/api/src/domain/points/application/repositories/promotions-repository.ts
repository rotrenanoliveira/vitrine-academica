import type { PointTransaction } from '../../enterprise/entities/point-transaction'
import type { Promotion } from '../../enterprise/entities/promotion'

export type CreatePromotionWithDebitResult =
  | { status: 'CREATED' }
  | { status: 'INSUFFICIENT_BALANCE'; balance: number }
  | { status: 'ALREADY_PROMOTED' }

export interface PromotionsRepository {
  createWithDebit(promotion: Promotion, debit: PointTransaction): Promise<CreatePromotionWithDebitResult>
}
