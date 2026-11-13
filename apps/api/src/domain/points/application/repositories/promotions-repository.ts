import type { PointTransaction } from '../../enterprise/entities/point-transaction'
import type { Promotion } from '../../enterprise/entities/promotion'

export type CreatePromotionWithDebitResult =
  | { status: 'CREATED' }
  | { status: 'INSUFFICIENT_BALANCE'; balance: number }
  | { status: 'ALREADY_PROMOTED' }

export interface PromotionsRepository {
  createWithDebit(promotion: Promotion, debit: PointTransaction): Promise<CreatePromotionWithDebitResult>
  findManyActive(now: Date): Promise<Promotion[]>
  findActiveProjectIds(projectIds: string[], now: Date): Promise<string[]>
  findManyDueForExpiration(now: Date): Promise<Promotion[]>
  tryExpire(promotionId: string, now: Date): Promise<boolean>
}
