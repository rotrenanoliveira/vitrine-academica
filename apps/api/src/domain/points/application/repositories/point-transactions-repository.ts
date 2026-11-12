import type { PointTransaction, PointTransactionReason } from '../../enterprise/entities/point-transaction'

export interface PointTransactionsRepository {
  findByReasonReferenceAndUser(
    reason: PointTransactionReason,
    referenceId: string,
    userId: string,
  ): Promise<PointTransaction | null>
  findManyByUserId(userId: string, limit: number): Promise<PointTransaction[]>
  getBalanceByUserId(userId: string): Promise<number>

  create(transaction: PointTransaction): Promise<void>
}
