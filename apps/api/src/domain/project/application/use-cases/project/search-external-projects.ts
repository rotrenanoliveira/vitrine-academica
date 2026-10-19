import { type Either, left, right } from '@/core/either'
import { ExternalServiceError } from '../../_errors/external-service-error'
import type { AcademicProjectDto } from '../../dtos/academic-project-dto'
import type { ExternalProjectsSearch } from '../../external/external-projects-search'

interface SearchExternalProjectsRequest {
  query: string
}

type SearchExternalProjectsResponse = Either<ExternalServiceError, { projects: AcademicProjectDto[] }>

export class SearchExternalProjectsUseCase {
  constructor(private externalProjectsSearch: ExternalProjectsSearch) {}

  async execute({ query }: SearchExternalProjectsRequest): Promise<SearchExternalProjectsResponse> {
    const projects = await this.externalProjectsSearch.search(query)

    if (!projects) {
      return left(new ExternalServiceError())
    }

    return right({ projects })
  }
}
