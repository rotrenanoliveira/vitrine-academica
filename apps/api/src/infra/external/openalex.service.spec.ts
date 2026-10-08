import { server } from '@tests/mocks/server'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import '@tests/mocks/setup-msw'
import { OpenAlexService } from './openalex.service'

describe('(Integration) - OpenAlexService', () => {
  it('mapeia a resposta da OpenAlex para AcademicProjectDto', async () => {
    const sut = new OpenAlexService()

    const projects = await sut.search('Engenharia de Software')

    expect(projects).toHaveLength(1)
    expect(projects).toEqual([
      {
        title: 'PFC Teste',
        authors: ['Thainá Soares'],
        externalUrl: 'https://pfc.1234/test',
        publishedIn: 'PFC UMC',
        abstract: 'Resumo de teste',
      },
    ])
  })

  it('retorna lista vazia quando a API não encontra resultados', async () => {
    const sut = new OpenAlexService()

    const projects = await sut.search('query sem resultados')

    expect(projects).toEqual([])
  })

  it('propaga falha quando a API externa retorna erro', async () => {
    server.use(
      http.get('https://api.openalex.org/works', () => {
        return HttpResponse.json({ message: 'unavailable' }, { status: 503 })
      }),
    )

    const sut = new OpenAlexService()

    await expect(sut.search('Engenharia de Software')).rejects.toThrow()
  })
})
