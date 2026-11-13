import { GetMyPointsBalanceUseCase } from '@/domain/points/application/use-cases/point-transaction/get-my-points-balance'
import { db } from '@/infra/database/drizzle/client'
import { DrizzlePointTransactionsRepository } from '@/infra/database/repositories/drizzle-point-transactions-repository'
import { GetMyPointsBalanceController } from '../../controllers/points/get-my-points-balance.controller'

export function makeGetMyPointsBalanceController() {
  const getMyPointsBalanceUseCase = new GetMyPointsBalanceUseCase(new DrizzlePointTransactionsRepository(db))

  return new GetMyPointsBalanceController(getMyPointsBalanceUseCase)
}
