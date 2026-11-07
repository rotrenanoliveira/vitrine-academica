export interface LabelCount {
  label: string
  total: number
}

export interface DailyCount {
  date: string
  total: number
}

export interface TagUsage {
  tagId: string
  name: string
  slug: string
  total: number
}

export interface AnalyticsRepository {
  countProjectsByStatus(): Promise<LabelCount[]>
  countProjectsCreatedByDay(since: Date): Promise<DailyCount[]>
  countUsersByStatus(): Promise<LabelCount[]>
  countUsersCreatedByDay(since: Date): Promise<DailyCount[]>
  countInstitutionsByStatus(): Promise<LabelCount[]>
  countActiveMembersByRole(): Promise<LabelCount[]>
  countPendingMembershipRequests(): Promise<number>
  findMostUsedTags(limit: number): Promise<TagUsage[]>
}
