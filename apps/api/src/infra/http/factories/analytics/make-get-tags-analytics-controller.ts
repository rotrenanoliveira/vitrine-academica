import { GetTagsAnalyticsUseCase } from '@/domain/analytics/application/use-cases/get-tags-analytics'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAnalyticsRepository } from '@/infra/database/repositories/drizzle-analytics-repository'
import { GetTagsAnalyticsController } from '../../controllers/analytics/get-tags-analytics.controller'

export function makeGetTagsAnalyticsController() {
  const analyticsRepository = new DrizzleAnalyticsRepository(db)
  const getTagsAnalyticsUseCase = new GetTagsAnalyticsUseCase(analyticsRepository)

  return new GetTagsAnalyticsController(getTagsAnalyticsUseCase)
}
