import { type Either, right } from '@/core/either'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import type { AnalyticsRepository, DailyCount, LabelCount } from '../repositories/analytics-repository'
import { fillDailySeries, fillLabelCounts, periodStart, sumTotals } from '../utils/series'

interface GetUsersAnalyticsUseCaseRequest {
  days: number
}

type UsersAnalytics = {
  total: number
  createdInPeriod: number
  byStatus: LabelCount[]
  createdByDay: DailyCount[]
}

type GetUsersAnalyticsUseCaseResponse = Either<never, UsersAnalytics>

export class GetUsersAnalyticsUseCase {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async execute({ days }: GetUsersAnalyticsUseCaseRequest): Promise<GetUsersAnalyticsUseCaseResponse> {
    const { statusRows, dayRows } = await this.loadCounts(days)

    return right(this.buildReport(statusRows, dayRows, days))
  }

  private async loadCounts(days: number): Promise<{ statusRows: LabelCount[]; dayRows: DailyCount[] }> {
    const [statusRows, dayRows] = await Promise.all([
      this.analyticsRepository.countUsersByStatus(),
      this.analyticsRepository.countUsersCreatedByDay(periodStart(days)),
    ])

    return { statusRows, dayRows }
  }

  private buildReport(statusRows: LabelCount[], dayRows: DailyCount[], days: number): UsersAnalytics {
    const byStatus = fillLabelCounts(statusRows, Object.values(UserStatus))
    const createdByDay = fillDailySeries(dayRows, days)

    return {
      total: sumTotals(byStatus),
      createdInPeriod: sumTotals(createdByDay),
      byStatus,
      createdByDay,
    }
  }
}
