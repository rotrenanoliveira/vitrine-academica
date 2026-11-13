import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  PointTransaction,
  type PointTransactionProps,
  PointTransactionReason,
  PointTransactionType,
} from '@/domain/points/enterprise/entities/point-transaction'
import { db } from '@/infra/database/drizzle/client'
import { DrizzlePointTransactionsRepository } from '@/infra/database/repositories/drizzle-point-transactions-repository'

export function makePointTransaction(override: Partial<PointTransactionProps> = {}, id?: UniqueEntityId) {
  const pointTransaction = PointTransaction.create(
    {
      userId: new UniqueEntityId(),
      type: PointTransactionType.CREDIT,
      amount: 1,
      reason: PointTransactionReason.STAR_RECEIVED,
      referenceId: new UniqueEntityId(),
      ...override,
    },
    id,
  )

  return { pointTransaction }
}

export async function makePointTransactionOnDatabase(
  override: Partial<PointTransactionProps> = {},
  id?: UniqueEntityId,
) {
  const { pointTransaction } = makePointTransaction(override, id)

  const pointTransactionsRepository = new DrizzlePointTransactionsRepository(db)

  await pointTransactionsRepository.create(pointTransaction)

  return { pointTransaction }
}
