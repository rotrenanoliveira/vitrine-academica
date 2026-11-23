import { type Either, right } from '@/core/either'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import type { AnalyticsRepository, DailyCount, LabelCount } from '../repositories/analytics-repository'
import { fillDailySeries, fillLabelCounts, periodStart, sumTotals } from '../utils/series'

interface GetProjectsAnalyticsUseCaseRequest {
  days: number
}

type ProjectsAnalytics = {
  total: number
  createdInPeriod: number
  byStatus: LabelCount[]
  createdByDay: DailyCount[]
}

type GetProjectsAnalyticsUseCaseResponse = Either<never, ProjectsAnalytics>

export class GetProjectsAnalyticsUseCase {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async execute({ days }: GetProjectsAnalyticsUseCaseRequest): Promise<GetProjectsAnalyticsUseCaseResponse> {
    const { statusRows, dayRows } = await this.loadCounts(days)

    return right(this.buildReport(statusRows, dayRows, days))
  }

  private async loadCounts(days: number): Promise<{ statusRows: LabelCount[]; dayRows: DailyCount[] }> {
    const [statusRows, dayRows] = await Promise.all([
      this.analyticsRepository.countProjectsByStatus(),
      this.analyticsRepository.countProjectsCreatedByDay(periodStart(days)),
    ])

    return { statusRows, dayRows }
  }

  private buildReport(statusRows: LabelCount[], dayRows: DailyCount[], days: number): ProjectsAnalytics {
    const byStatus = fillLabelCounts(statusRows, Object.values(ProjectStatus))
    const createdByDay = fillDailySeries(dayRows, days)

    return {
      total: sumTotals(byStatus),
      createdInPeriod: sumTotals(createdByDay),
      byStatus,
      createdByDay,
    }
  }
}
