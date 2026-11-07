import { type Either, right } from '@/core/either'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import type { AnalyticsRepository, DailyCount, LabelCount } from '../repositories/analytics-repository'
import { fillDailySeries, fillLabelCounts, periodStart, sumTotals } from '../utils/series'

interface GetProjectsAnalyticsUseCaseRequest {
  days: number
}

type GetProjectsAnalyticsUseCaseResponse = Either<
  never,
  {
    total: number
    createdInPeriod: number
    byStatus: LabelCount[]
    createdByDay: DailyCount[]
  }
>

export class GetProjectsAnalyticsUseCase {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async execute({ days }: GetProjectsAnalyticsUseCaseRequest): Promise<GetProjectsAnalyticsUseCaseResponse> {
    const [statusRows, dayRows] = await Promise.all([
      this.analyticsRepository.countProjectsByStatus(),
      this.analyticsRepository.countProjectsCreatedByDay(periodStart(days)),
    ])

    const byStatus = fillLabelCounts(statusRows, Object.values(ProjectStatus))
    const createdByDay = fillDailySeries(dayRows, days)

    return right({
      total: sumTotals(byStatus),
      createdInPeriod: sumTotals(createdByDay),
      byStatus,
      createdByDay,
    })
  }
}
