import { type Either, right } from '@/core/either'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import type { AnalyticsRepository, LabelCount } from '../repositories/analytics-repository'
import { fillLabelCounts, sumTotals } from '../utils/series'

const INSTITUTION_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED']

type InstitutionsAnalytics = {
  total: number
  byStatus: LabelCount[]
  membersByRole: LabelCount[]
  pendingMembershipRequests: number
}

type GetInstitutionsAnalyticsUseCaseResponse = Either<never, InstitutionsAnalytics>

export class GetInstitutionsAnalyticsUseCase {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async execute(): Promise<GetInstitutionsAnalyticsUseCaseResponse> {
    const { statusRows, roleRows, pendingMembershipRequests } = await this.loadCounts()

    return right(this.buildReport(statusRows, roleRows, pendingMembershipRequests))
  }

  private async loadCounts(): Promise<{
    statusRows: LabelCount[]
    roleRows: LabelCount[]
    pendingMembershipRequests: number
  }> {
    const [statusRows, roleRows, pendingMembershipRequests] = await Promise.all([
      this.analyticsRepository.countInstitutionsByStatus(),
      this.analyticsRepository.countActiveMembersByRole(),
      this.analyticsRepository.countPendingMembershipRequests(),
    ])

    return { statusRows, roleRows, pendingMembershipRequests }
  }

  private buildReport(
    statusRows: LabelCount[],
    roleRows: LabelCount[],
    pendingMembershipRequests: number,
  ): InstitutionsAnalytics {
    const byStatus = fillLabelCounts(statusRows, INSTITUTION_STATUSES)
    const membersByRole = fillLabelCounts(roleRows, Object.values(InstitutionMemberRole))

    return {
      total: sumTotals(byStatus),
      byStatus,
      membersByRole,
      pendingMembershipRequests,
    }
  }
}
