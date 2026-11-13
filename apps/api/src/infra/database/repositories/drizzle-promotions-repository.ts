import { and, desc, eq, gt, lte, sql } from 'drizzle-orm'
import type {
  CreatePromotionWithDebitResult,
  PromotionsRepository,
} from '@/domain/points/application/repositories/promotions-repository'
import type { PointTransaction } from '@/domain/points/enterprise/entities/point-transaction'
import type { Promotion } from '@/domain/points/enterprise/entities/promotion'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzlePointTransactionMapper } from '../drizzle/mappers/drizzle-point-transaction-mapper'
import { DrizzlePromotionMapper } from '../drizzle/mappers/drizzle-promotion-mapper'
import { pointTransactions, promotions, users } from '../drizzle/schemas'

export class DrizzlePromotionsRepository implements PromotionsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async createWithDebit(promotion: Promotion, debit: PointTransaction): Promise<CreatePromotionWithDebitResult> {
    const projectId = promotion.projectId.toString()
    const promoterId = promotion.promoterId.toString()

    return this.db.transaction(async (tx): Promise<CreatePromotionWithDebitResult> => {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, promoterId)).for('update')

      await tx
        .update(promotions)
        .set({ status: 'EXPIRED' })
        .where(
          and(
            eq(promotions.projectId, projectId),
            eq(promotions.promoterId, promoterId),
            eq(promotions.status, 'ACTIVE'),
            lte(promotions.expiresAt, promotion.createdAt),
          ),
        )

      const [active] = await tx
        .select({ id: promotions.id })
        .from(promotions)
        .where(
          and(
            eq(promotions.projectId, projectId),
            eq(promotions.promoterId, promoterId),
            eq(promotions.status, 'ACTIVE'),
          ),
        )
        .limit(1)

      if (active) {
        return { status: 'ALREADY_PROMOTED' }
      }

      const [row] = await tx
        .select({
          balance: sql<number>`coalesce(sum(case when ${pointTransactions.type} = 'CREDIT' then ${pointTransactions.amount} else -${pointTransactions.amount} end), 0)::int`,
        })
        .from(pointTransactions)
        .where(eq(pointTransactions.userId, debit.userId.toString()))

      const balance = row?.balance ?? 0

      if (balance < debit.amount) {
        return { status: 'INSUFFICIENT_BALANCE', balance }
      }

      await tx.insert(promotions).values(DrizzlePromotionMapper.toPersistence(promotion))
      await tx.insert(pointTransactions).values(DrizzlePointTransactionMapper.toPersistence(debit))

      return { status: 'CREATED' }
    })
  }

  async findManyActive(now: Date): Promise<Promotion[]> {
    const rows = await this.db
      .select()
      .from(promotions)
      .where(and(eq(promotions.status, 'ACTIVE'), gt(promotions.expiresAt, now)))
      .orderBy(desc(promotions.createdAt), desc(promotions.id))

    return rows.map(DrizzlePromotionMapper.toDomain)
  }
}
