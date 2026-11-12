import { type Either, left, right } from '@/core/either'
import { ExternalServiceError } from '../../_errors/external-service-error'
import type { AcademicProjectDto } from '../../dtos/academic-project-dto'
import type { ExternalProjectsSearch } from '../../external/external-projects-search'

interface SearchExternalProjectsRequest {
  query: string
  page?: number
}

type SearchExternalProjectsResponse = Either<
  ExternalServiceError,
  {
    projects: AcademicProjectDto[]
    page: number
    perPage: number
    hasNextPage: boolean
  }
>

export class SearchExternalProjectsUseCase {
  constructor(private externalProjectsSearch: ExternalProjectsSearch) {}

  async execute({
    query,
    page = 1,
  }: SearchExternalProjectsRequest): Promise<SearchExternalProjectsResponse> {
    const result = await this.externalProjectsSearch.search(query, page)

    if (!result) {
      return left(new ExternalServiceError())
    }

    return right(result)
  }
}
