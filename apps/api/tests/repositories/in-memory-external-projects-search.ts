import type { AcademicProjectDto } from '@/domain/project/application/dtos/academic-project-dto'
import type { ExternalProjectsSearch } from '@/domain/project/application/external/external-projects-search'

export class InMemoryExternalProjectsSearch implements ExternalProjectsSearch {
  items: AcademicProjectDto[] = []
  lastQuery: string | null = null
  shouldFail = false

  async search(query: string): Promise<AcademicProjectDto[] | null> {
    this.lastQuery = query

    if (this.shouldFail) {
      // throw new Error('External service unavailable')
      return null
    }

    return this.items
  }
}
