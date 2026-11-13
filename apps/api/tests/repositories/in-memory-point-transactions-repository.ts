import type { PointTransactionsRepository } from '@/domain/points/application/repositories/point-transactions-repository'
import {
  type PointTransaction,
  type PointTransactionReason,
  PointTransactionType,
} from '@/domain/points/enterprise/entities/point-transaction'

export class InMemoryPointTransactionsRepository implements PointTransactionsRepository {
  public items: PointTransaction[] = []

  async findByReasonReferenceAndUser(
    reason: PointTransactionReason,
    referenceId: string,
    userId: string,
  ): Promise<PointTransaction | null> {
    return (
      this.items.find(
        (item) =>
          item.reason === reason && item.referenceId.toString() === referenceId && item.userId.toString() === userId,
      ) ?? null
    )
  }

  async findManyByUserId(userId: string, limit: number): Promise<PointTransaction[]> {
    return this.items
      .filter((item) => item.userId.toString() === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  async findAllByUserId(userId: string): Promise<PointTransaction[]> {
    return this.items
      .filter((item) => item.userId.toString() === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async getBalanceByUserId(userId: string): Promise<number> {
    return this.items
      .filter((item) => item.userId.toString() === userId)
      .reduce((sum, item) => sum + (item.type === PointTransactionType.CREDIT ? item.amount : -item.amount), 0)
  }

  async create(transaction: PointTransaction): Promise<void> {
    const duplicated = await this.findByReasonReferenceAndUser(
      transaction.reason,
      transaction.referenceId.toString(),
      transaction.userId.toString(),
    )

    if (duplicated) {
      throw new Error('Transação de pontos duplicada para o mesmo motivo, referência e usuário.')
    }

    this.items.push(transaction)
  }
}
