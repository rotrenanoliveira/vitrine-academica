import type { AcademicProjectDto } from '../dtos/academic-project-dto'

export interface ExternalProjectsSearchResult {
  projects: AcademicProjectDto[]
  page: number
  perPage: number
  hasNextPage: boolean
}

export interface ExternalProjectsSearch {
  search(query: string, page?: number): Promise<ExternalProjectsSearchResult | null>
}
