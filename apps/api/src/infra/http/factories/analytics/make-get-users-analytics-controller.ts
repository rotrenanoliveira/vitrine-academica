import { GetUsersAnalyticsUseCase } from '@/domain/analytics/application/use-cases/get-users-analytics'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAnalyticsRepository } from '@/infra/database/repositories/drizzle-analytics-repository'
import { GetUsersAnalyticsController } from '../../controllers/analytics/get-users-analytics.controller'

export function makeGetUsersAnalyticsController() {
  const analyticsRepository = new DrizzleAnalyticsRepository(db)
  const getUsersAnalyticsUseCase = new GetUsersAnalyticsUseCase(analyticsRepository)

  return new GetUsersAnalyticsController(getUsersAnalyticsUseCase)
}
