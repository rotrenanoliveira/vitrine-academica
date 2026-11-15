import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { OpenAlexService } from './openalex.service'

const OPENALEX_WORKS_URL = 'https://api.openalex.org/works'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

function openAlexWork() {
  return {
    id: 'https://openalex.org/W123',
    doi: 'https://doi.org/10.1234/teste',
    title: 'PFC Teste',
    authorships: [{ author: { display_name: 'Thainá Soares' } }],
    primary_location: {
      landing_page_url: 'https://pfc.1234/test',
      source: { display_name: 'PFC UMC' },
    },
    abstract_inverted_index: {
      Resumo: [0],
      de: [1],
      teste: [2],
    },
  }
}

describe('(Integration) - OpenAlexService', () => {
  it('mapeia a resposta da OpenAlex para AcademicProjectDto', async () => {
    server.use(
      http.get(OPENALEX_WORKS_URL, () => {
        return HttpResponse.json({
          results: [openAlexWork()],
          meta: { count: 1, page: 1, per_page: 30 },
        })
      }),
    )

    const sut = new OpenAlexService()

    const result = await sut.search('Engenharia de Software')

    expect(result).toEqual({
      projects: [
        {
          title: 'PFC Teste',
          authors: ['Thainá Soares'],
          externalUrl: 'https://pfc.1234/test',
          publishedIn: 'PFC UMC',
          abstract: 'Resumo de teste',
        },
      ],
      page: 1,
      perPage: 30,
      hasNextPage: false,
    })
  })

  it('retorna lista vazia quando a API não encontra resultados', async () => {
    server.use(
      http.get(OPENALEX_WORKS_URL, () => {
        return HttpResponse.json({
          results: [],
          meta: { count: 0, page: 1, per_page: 30 },
        })
      }),
    )

    const sut = new OpenAlexService()

    const result = await sut.search('query sem resultados')

    expect(result).toEqual({
      projects: [],
      page: 1,
      perPage: 30,
      hasNextPage: false,
    })
  })

  it('propaga falha quando a API externa retorna erro', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    server.use(
      http.get(OPENALEX_WORKS_URL, () => {
        return HttpResponse.json({ message: 'unavailable' }, { status: 503 })
      }),
    )

    const sut = new OpenAlexService()

    await expect(sut.search('Engenharia de Software')).resolves.toBeNull()
  })
})
