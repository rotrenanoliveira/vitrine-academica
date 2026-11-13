import type { PointTransaction } from '@/domain/points/enterprise/entities/point-transaction'

export class PointTransactionPresenter {
  static toHTTP(transaction: PointTransaction) {
    return {
      id: transaction.id.toString(),
      type: transaction.type,
      amount: transaction.amount,
      reason: transaction.reason,
      referenceId: transaction.referenceId.toString(),
      createdAt: transaction.createdAt.toISOString(),
    }
  }
}
