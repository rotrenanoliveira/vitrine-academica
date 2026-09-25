import { SearchExternalProjectsUseCase } from '@/domain/project/application/use-cases/project/search-external-projects'
import { OpenAlexService } from '@/infra/external/openalex.service'
import { SearchExternalProjectsController } from '@/infra/http/controllers/project/search-external-projects.controller'

export function makeSearchExternalProjectsController() {
  const openAlexService = new OpenAlexService()
  const searchExternalProjectsUseCase = new SearchExternalProjectsUseCase(openAlexService)

  return new SearchExternalProjectsController(searchExternalProjectsUseCase)
}
