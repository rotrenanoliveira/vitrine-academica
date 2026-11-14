import type { Project } from '@/domain/project/enterprise/entities/project'

export interface CurationFilters {
  since: Date
  institutionId: string | undefined
  title: string | undefined
  tagIds: string[] | undefined
  limit: number | undefined
}

export interface CurationRepository {
  findTopByTeachers(filters: CurationFilters): Promise<Project[]>
  findTopByCommunity(filters: CurationFilters): Promise<Project[]>
}
