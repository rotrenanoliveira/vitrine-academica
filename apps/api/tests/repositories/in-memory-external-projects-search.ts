import type { AcademicProjectDto } from '@/domain/project/application/dtos/academic-project-dto'
import type {
  ExternalProjectsSearch,
  ExternalProjectsSearchResult,
} from '@/domain/project/application/external/external-projects-search'

export class InMemoryExternalProjectsSearch implements ExternalProjectsSearch {
  items: AcademicProjectDto[] = []
  lastQuery: string | null = null
  lastPage: number | null = null
  shouldFail = false
  perPage = 30
  hasNextPage = false

  async search(query: string, page = 1): Promise<ExternalProjectsSearchResult | null> {
    this.lastQuery = query
    this.lastPage = page

    if (this.shouldFail) {
      return null
    }

    return {
      projects: this.items,
      page,
      perPage: this.perPage,
      hasNextPage: this.hasNextPage,
    }
  }
}
