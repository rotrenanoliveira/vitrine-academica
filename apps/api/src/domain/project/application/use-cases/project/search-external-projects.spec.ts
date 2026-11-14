import { InMemoryExternalProjectsSearch } from '@tests/repositories/in-memory-external-projects-search'
import { beforeEach, describe, expect, it } from 'vitest'
import { ExternalServiceError } from '../../_errors/external-service-error'
import { SearchExternalProjectsUseCase } from './search-external-projects'

let externalProjectsSearch: InMemoryExternalProjectsSearch
let sut: SearchExternalProjectsUseCase

describe('(UC) - Search External Projects', () => {
  beforeEach(() => {
    externalProjectsSearch = new InMemoryExternalProjectsSearch()
    sut = new SearchExternalProjectsUseCase(externalProjectsSearch)

    externalProjectsSearch.items = [
      {
        title: 'PFC Teste',
        authors: ['Thainá Soares'],
        externalUrl: 'https://PFC/test',
        publishedIn: 'Revista UMC',
        abstract: 'Resumo reconstruído para o teste.',
      },
    ]
  })

  it('pesquisa por projetos externos', async () => {
    const result = await sut.execute({ query: 'Engenharia de Software' })

    expect(externalProjectsSearch.lastQuery).toBe('Engenharia de Software')
    expect(externalProjectsSearch.lastPage).toBe(1)
    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].title).toBe('PFC Teste')
      expect(result.value.page).toBe(1)
      expect(result.value.perPage).toBe(30)
      expect(result.value.hasNextPage).toBe(false)
    }
  })

  it('repassa a página solicitada ao serviço externo', async () => {
    externalProjectsSearch.hasNextPage = true

    const result = await sut.execute({ query: 'Engenharia de Software', page: 2 })

    expect(externalProjectsSearch.lastPage).toBe(2)
    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.page).toBe(2)
      expect(result.value.hasNextPage).toBe(true)
    }
  })

  it('retorna erro quando o serviço externo está indisponível', async () => {
    externalProjectsSearch.shouldFail = true

    const result = await sut.execute({ query: 'Engenharia de Software' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ExternalServiceError)
  })
})
