import { makeTag } from '@tests/factories/make-tag'
import { InMemoryTagsRepository } from '@tests/repositories/in-memory-tags-repository'
import { TagAlreadyExistsError } from '../../_errors/tag-already-exists-error'
import { RegisterTagUseCase } from './register-tag'

let tagsRepository: InMemoryTagsRepository
let sut: RegisterTagUseCase

describe('(UC) - Register Tag', () => {
  beforeEach(() => {
    tagsRepository = new InMemoryTagsRepository()
    sut = new RegisterTagUseCase(tagsRepository)
  })

  it('pode registrar uma nova tag', async () => {
    const result = await sut.execute({
      name: 'Biologia',
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.tag.name).toBe('Biologia')
      expect(result.value.tag.slug.value).toBe('biologia')
      expect(tagsRepository.items).toHaveLength(1)
    }
  })

  it('não pode registrar uma tag com slug repetido', async () => {
    const { tag } = makeTag({ name: 'Machine Learning' })
    tagsRepository.items.push(tag)

    const result = await sut.execute({
      name: 'Machine Learning',
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(TagAlreadyExistsError)
    }
  })
})
