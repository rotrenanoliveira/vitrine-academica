import { GetProjectsAnalyticsUseCase } from '@/domain/analytics/application/use-cases/get-projects-analytics'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAnalyticsRepository } from '@/infra/database/repositories/drizzle-analytics-repository'
import { GetProjectsAnalyticsController } from '../../controllers/analytics/get-projects-analytics.controller'

export function makeGetProjectsAnalyticsController() {
  const analyticsRepository = new DrizzleAnalyticsRepository(db)
  const getProjectsAnalyticsUseCase = new GetProjectsAnalyticsUseCase(analyticsRepository)

  return new GetProjectsAnalyticsController(getProjectsAnalyticsUseCase)
}
