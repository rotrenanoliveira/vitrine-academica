import { makeTag } from '@tests/factories/make-tag'
import { InMemoryTagsRepository } from '@tests/repositories/in-memory-tags-repository'
import { FetchTagsUseCase } from './fetch-tags'

let tagsRepository: InMemoryTagsRepository
let sut: FetchTagsUseCase

describe('(UC) - Fetch Tags', () => {
  beforeEach(() => {
    tagsRepository = new InMemoryTagsRepository()
    sut = new FetchTagsUseCase(tagsRepository)
  })

  it('pode buscar todas as tags', async () => {
    const { tag: firstTag } = makeTag({ name: 'Biologia' })
    const { tag: secondTag } = makeTag({ name: 'Química' })
    tagsRepository.items.push(firstTag, secondTag)

    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.tags).toHaveLength(2)
      expect(result.value.tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Biologia' }),
          expect.objectContaining({ name: 'Química' }),
        ]),
      )
    }
  })

  it('pode buscar uma lista vazia quando não existem tags', async () => {
    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.tags).toHaveLength(0)
    }
  })
})
