import { makePreferenceTag } from '@tests/factories/make-preference-tag'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryPreferenceTagsRepository } from '@tests/repositories/in-memory-preference-tags-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { FetchUserPreferenceTagsUseCase } from './fetch-user-preference-tags'

let preferenceTagsRepository: InMemoryPreferenceTagsRepository
let usersRepository: InMemoryUsersRepository
let sut: FetchUserPreferenceTagsUseCase

describe('(UC) - Fetch User Preference Tags', () => {
  beforeEach(() => {
    preferenceTagsRepository = new InMemoryPreferenceTagsRepository()
    usersRepository = new InMemoryUsersRepository()
    sut = new FetchUserPreferenceTagsUseCase(preferenceTagsRepository, usersRepository)
  })

  it('pode buscar preferências de tag de um usuário', async () => {
    const { user } = makeUser()
    usersRepository.items.push(user)

    const { preferenceTag: firstPreference } = makePreferenceTag({ userId: user.id })
    const { preferenceTag: secondPreference } = makePreferenceTag({ userId: user.id })
    const { preferenceTag: otherUserPreference } = makePreferenceTag({
      userId: new UniqueEntityId(),
    })
    preferenceTagsRepository.items.push(firstPreference, secondPreference, otherUserPreference)

    const result = await sut.execute({
      userId: user.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.preferenceTags).toHaveLength(2)
    }
  })

  it('não pode buscar preferências de tag quando o usuário não existe', async () => {
    const result = await sut.execute({
      userId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })
})
