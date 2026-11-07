import { GetInstitutionsAnalyticsUseCase } from '@/domain/analytics/application/use-cases/get-institutions-analytics'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAnalyticsRepository } from '@/infra/database/repositories/drizzle-analytics-repository'
import { GetInstitutionsAnalyticsController } from '../../controllers/analytics/get-institutions-analytics.controller'

export function makeGetInstitutionsAnalyticsController() {
  const analyticsRepository = new DrizzleAnalyticsRepository(db)
  const getInstitutionsAnalyticsUseCase = new GetInstitutionsAnalyticsUseCase(analyticsRepository)

  return new GetInstitutionsAnalyticsController(getInstitutionsAnalyticsUseCase)
}
