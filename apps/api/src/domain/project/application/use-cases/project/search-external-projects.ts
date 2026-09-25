import { type Either, left, right } from '@/core/either'
import type { OpenAlexService } from '@/infra/external/openalex.service'
import { ExternalServiceError } from '../../_errors/external-service-error'
import type { AcademicProjectDto } from '../../dtos/academic-project-dto'

interface SearchExternalProjectsRequest {
  query: string
}

type SearchExternalProjectsResponse = Either<ExternalServiceError, { projects: AcademicProjectDto[] }>

export class SearchExternalProjectsUseCase {
  constructor(private openAlexService: OpenAlexService) {}

  async execute({ query }: SearchExternalProjectsRequest): Promise<SearchExternalProjectsResponse> {
    try {
      const projects = await this.openAlexService.search(query)

      return right({ projects })
    } catch (error) {
      return left(new ExternalServiceError(error))
    }
  }
}
