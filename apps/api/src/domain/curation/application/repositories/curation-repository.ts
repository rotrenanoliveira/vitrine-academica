import type { Project } from '@/domain/project/enterprise/entities/project'

export interface CurationFilters {
  since: Date
  institutionId: string | undefined
  limit: number
}

export interface TeacherCurationEntry {
  project: Project
  teacherAverage: number
  teacherRatingsCount: number
}

export interface CommunityCurationEntry {
  project: Project
  weightedScore: number
  starsCount: number
}

export interface CurationRepository {
  findTopByTeachers(filters: CurationFilters): Promise<TeacherCurationEntry[]>
  findTopByCommunity(filters: CurationFilters): Promise<CommunityCurationEntry[]>
}
