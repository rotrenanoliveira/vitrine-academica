import { type Either, right } from '@/core/either'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import type { AnalyticsRepository, LabelCount } from '../repositories/analytics-repository'
import { fillLabelCounts, sumTotals } from '../utils/series'

const INSTITUTION_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED']

type GetInstitutionsAnalyticsUseCaseResponse = Either<
  never,
  {
    total: number
    byStatus: LabelCount[]
    membersByRole: LabelCount[]
    pendingMembershipRequests: number
  }
>

export class GetInstitutionsAnalyticsUseCase {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async execute(): Promise<GetInstitutionsAnalyticsUseCaseResponse> {
    const [statusRows, roleRows, pendingMembershipRequests] = await Promise.all([
      this.analyticsRepository.countInstitutionsByStatus(),
      this.analyticsRepository.countActiveMembersByRole(),
      this.analyticsRepository.countPendingMembershipRequests(),
    ])

    const byStatus = fillLabelCounts(statusRows, INSTITUTION_STATUSES)
    const membersByRole = fillLabelCounts(roleRows, Object.values(InstitutionMemberRole))

    return right({
      total: sumTotals(byStatus),
      byStatus,
      membersByRole,
      pendingMembershipRequests,
    })
  }
}
