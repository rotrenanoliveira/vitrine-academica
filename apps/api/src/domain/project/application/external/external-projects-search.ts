import type { AcademicProjectDto } from '../dtos/academic-project-dto'

export interface ExternalProjectsSearch {
  search(query: string): Promise<AcademicProjectDto[] | null>
}
