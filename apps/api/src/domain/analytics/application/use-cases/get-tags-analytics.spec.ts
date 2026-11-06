import { InMemoryAnalyticsRepository } from '@tests/repositories/in-memory-analytics-repository'
import { GetTagsAnalyticsUseCase } from './get-tags-analytics'

let analyticsRepository: InMemoryAnalyticsRepository
let sut: GetTagsAnalyticsUseCase

describe('(UC) - Get Tags Analytics', () => {
  beforeEach(() => {
    analyticsRepository = new InMemoryAnalyticsRepository()
    sut = new GetTagsAnalyticsUseCase(analyticsRepository)
  })

  it('deve respeitar o limite de tags', async () => {
    analyticsRepository.tags = [
      { tagId: '1', name: 'Educação', slug: 'educacao', total: 5 },
      { tagId: '2', name: 'Saúde', slug: 'saude', total: 3 },
      { tagId: '3', name: 'Cultura', slug: 'cultura', total: 1 },
    ]

    const result = await sut.execute({ limit: 2 })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.tags).toHaveLength(2)
      expect(result.value.tags.map((tag) => tag.slug)).toEqual(['educacao', 'saude'])
    }
  })

  it('deve devolver uma lista vazia quando nenhuma tag foi usada', async () => {
    const result = await sut.execute({ limit: 10 })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.tags).toEqual([])
    }
  })
})
