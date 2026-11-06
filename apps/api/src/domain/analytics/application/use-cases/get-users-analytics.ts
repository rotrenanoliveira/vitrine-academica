import { type Either, right } from '@/core/either'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import type { AnalyticsRepository, DailyCount, LabelCount } from '../repositories/analytics-repository'
import { fillDailySeries, fillLabelCounts, periodStart, sumTotals } from '../utils/series'

interface GetUsersAnalyticsUseCaseRequest {
  days: number
}

type GetUsersAnalyticsUseCaseResponse = Either<
  never,
  {
    total: number
    createdInPeriod: number
    byStatus: LabelCount[]
    createdByDay: DailyCount[]
  }
>

export class GetUsersAnalyticsUseCase {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async execute({ days }: GetUsersAnalyticsUseCaseRequest): Promise<GetUsersAnalyticsUseCaseResponse> {
    const [statusRows, dayRows] = await Promise.all([
      this.analyticsRepository.countUsersByStatus(),
      this.analyticsRepository.countUsersCreatedByDay(periodStart(days)),
    ])

    const byStatus = fillLabelCounts(statusRows, Object.values(UserStatus))
    const createdByDay = fillDailySeries(dayRows, days)

    return right({
      total: sumTotals(byStatus),
      createdInPeriod: sumTotals(createdByDay),
      byStatus,
      createdByDay,
    })
  }
}
