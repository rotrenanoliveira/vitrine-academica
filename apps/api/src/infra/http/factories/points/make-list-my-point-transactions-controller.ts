import { ListMyPointTransactionsUseCase } from '@/domain/points/application/use-cases/point-transaction/list-my-point-transactions'
import { db } from '@/infra/database/drizzle/client'
import { DrizzlePointTransactionsRepository } from '@/infra/database/repositories/drizzle-point-transactions-repository'
import { ListMyPointTransactionsController } from '../../controllers/points/list-my-point-transactions.controller'

export function makeListMyPointTransactionsController() {
  const listMyPointTransactionsUseCase = new ListMyPointTransactionsUseCase(new DrizzlePointTransactionsRepository(db))

  return new ListMyPointTransactionsController(listMyPointTransactionsUseCase)
}
