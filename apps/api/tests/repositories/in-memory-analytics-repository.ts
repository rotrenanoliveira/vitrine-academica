import type {
  AnalyticsRepository,
  DailyCount,
  LabelCount,
  TagUsage,
} from '@/domain/analytics/application/repositories/analytics-repository'

function dayOf(date: Date) {
  return date.toISOString().slice(0, 10)
}

export class InMemoryAnalyticsRepository implements AnalyticsRepository {
  public projectsByStatus: LabelCount[] = []
  public projectsCreatedByDay: DailyCount[] = []
  public usersByStatus: LabelCount[] = []
  public usersCreatedByDay: DailyCount[] = []
  public institutionsByStatus: LabelCount[] = []
  public activeMembersByRole: LabelCount[] = []
  public pendingMembershipRequests = 0
  public tags: TagUsage[] = []

  async countProjectsByStatus(): Promise<LabelCount[]> {
    return this.projectsByStatus
  }

  async countProjectsCreatedByDay(since: Date): Promise<DailyCount[]> {
    return this.projectsCreatedByDay.filter((row) => row.date >= dayOf(since))
  }

  async countUsersByStatus(): Promise<LabelCount[]> {
    return this.usersByStatus
  }

  async countUsersCreatedByDay(since: Date): Promise<DailyCount[]> {
    return this.usersCreatedByDay.filter((row) => row.date >= dayOf(since))
  }

  async countInstitutionsByStatus(): Promise<LabelCount[]> {
    return this.institutionsByStatus
  }

  async countActiveMembersByRole(): Promise<LabelCount[]> {
    return this.activeMembersByRole
  }

  async countPendingMembershipRequests(): Promise<number> {
    return this.pendingMembershipRequests
  }

  async findMostUsedTags(limit: number): Promise<TagUsage[]> {
    return this.tags.slice(0, limit)
  }
}
