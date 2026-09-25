import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OpenAlexService } from '@/infra/external/openalex.service'
import { ExternalServiceError } from '../../_errors/external-service-error'
import { SearchExternalProjectsUseCase } from './search-external-projects'

let openAlexService: OpenAlexService
let sut: SearchExternalProjectsUseCase

describe('(UC) - Nenhum projeto encontrado', () => {
  beforeEach(() => {
    openAlexService = new OpenAlexService()
    sut = new SearchExternalProjectsUseCase(openAlexService)

    vi.spyOn(openAlexService, 'search').mockResolvedValue([
      {
        title: 'PFC Teste',
        authors: ['Thainá Soares'],
        externalUrl: 'https://PFC/test',
        publishedIn: 'Revista UMC',
        abstract: 'Resumo reconstruído para o teste.',
      },
    ])
  })

  it('Pesquisa por projetos externos', async () => {
    const query = 'Engenhria de Software'

    const result = await sut.execute({ query })

    expect(openAlexService.search).toHaveBeenCalledWith(query)
    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].title).toBe('PFC Teste')
    }
  })

  it('Nenhum projeto encontrado', async () => {
    vi.spyOn(openAlexService, 'search').mockResolvedValueOnce([])

    const result = await sut.execute({ query: 'query-sem-resultados' })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(0)
    }
  })

  it('Erro', async () => {
    const failure = new Error('OpenAlex unavailable')
    vi.spyOn(openAlexService, 'search').mockRejectedValueOnce(failure)

    const result = await sut.execute({ query: 'Engenharia de Software' })

    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ExternalServiceError)
    }
  })
})
