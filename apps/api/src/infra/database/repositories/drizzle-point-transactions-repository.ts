import { and, desc, eq, sql } from 'drizzle-orm'
import type { PointTransactionsRepository } from '@/domain/points/application/repositories/point-transactions-repository'
import type { PointTransaction, PointTransactionReason } from '@/domain/points/enterprise/entities/point-transaction'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzlePointTransactionMapper } from '../drizzle/mappers/drizzle-point-transaction-mapper'
import { pointTransactions } from '../drizzle/schemas'

export class DrizzlePointTransactionsRepository implements PointTransactionsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findByReasonReferenceAndUser(
    reason: PointTransactionReason,
    referenceId: string,
    userId: string,
  ): Promise<PointTransaction | null> {
    const [row] = await this.db
      .select()
      .from(pointTransactions)
      .where(
        and(
          eq(pointTransactions.reason, reason),
          eq(pointTransactions.referenceId, referenceId),
          eq(pointTransactions.userId, userId),
        ),
      )
      .limit(1)

    if (!row) {
      return null
    }

    return DrizzlePointTransactionMapper.toDomain(row)
  }

  async findManyByUserId(userId: string, limit: number): Promise<PointTransaction[]> {
    const rows = await this.db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))
      .orderBy(desc(pointTransactions.createdAt), desc(pointTransactions.id))
      .limit(limit)

    return rows.map(DrizzlePointTransactionMapper.toDomain)
  }

  async getBalanceByUserId(userId: string): Promise<number> {
    const [row] = await this.db
      .select({
        balance: sql<number>`coalesce(sum(case when ${pointTransactions.type} = 'CREDIT' then ${pointTransactions.amount} else -${pointTransactions.amount} end), 0)::int`,
      })
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))

    return row?.balance ?? 0
  }

  async create(transaction: PointTransaction): Promise<void> {
    await this.db.insert(pointTransactions).values(DrizzlePointTransactionMapper.toPersistence(transaction))
  }
}
