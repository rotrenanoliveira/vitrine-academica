export type LabelCount = {
  label: string
  total: number
}

export type DailyCount = {
  date: string
  total: number
}

export type ProjectsAnalytics = {
  total: number
  createdInPeriod: number
  byStatus: LabelCount[]
  createdByDay: DailyCount[]
}

export type UsersAnalytics = {
  total: number
  createdInPeriod: number
  byStatus: LabelCount[]
  createdByDay: DailyCount[]
}

export type InstitutionsAnalytics = {
  total: number
  byStatus: LabelCount[]
  membersByRole: LabelCount[]
  pendingMembershipRequests: number
}

export type TagUsage = {
  tagId: string
  name: string
  slug: string
  total: number
}

export type TagsAnalytics = {
  tags: TagUsage[]
}
