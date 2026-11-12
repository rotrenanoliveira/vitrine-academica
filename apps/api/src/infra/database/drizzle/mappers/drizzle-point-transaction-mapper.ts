import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  PointTransaction,
  type PointTransactionReason,
  type PointTransactionType,
} from '@/domain/points/enterprise/entities/point-transaction'
import type { pointTransactions } from '../schemas/point-transactions'

type DrizzlePointTransaction = typeof pointTransactions.$inferSelect
type DrizzlePointTransactionInsert = typeof pointTransactions.$inferInsert

export class DrizzlePointTransactionMapper {
  static toDomain(row: DrizzlePointTransaction): PointTransaction {
    return PointTransaction.create(
      {
        userId: new UniqueEntityId(row.userId),
        type: row.type as PointTransactionType,
        amount: row.amount,
        reason: row.reason as PointTransactionReason,
        referenceId: new UniqueEntityId(row.referenceId),
        createdAt: row.createdAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(entity: PointTransaction): DrizzlePointTransactionInsert {
    return {
      id: entity.id.toString(),
      userId: entity.userId.toString(),
      type: entity.type,
      amount: entity.amount,
      reason: entity.reason,
      referenceId: entity.referenceId.toString(),
      createdAt: entity.createdAt,
    }
  }
}
