import { makeUser } from '@tests/factories/make-user'
import { InMemoryAccountsRepository } from '@tests/repositories/in-memory-accounts-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryPreferenceTagsRepository } from '@tests/repositories/in-memory-preference-tags-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemorySessionsRepository } from '@tests/repositories/in-memory-sessions-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UserNotFoundError } from '../../_errors/user-not-found-error'
import { ExportUserDataUseCase } from './export-user-data'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryAccountsRepository: InMemoryAccountsRepository
let inMemorySessionsRepository: InMemorySessionsRepository
let inMemoryInstitutionMembersRepository: InMemoryInstitutionMembersRepository
let inMemoryPreferenceTagsRepository: InMemoryPreferenceTagsRepository
let inMemoryProjectsRepository: InMemoryProjectsRepository
let sut: ExportUserDataUseCase

describe('Export User Data Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryAccountsRepository = new InMemoryAccountsRepository()
    inMemorySessionsRepository = new InMemorySessionsRepository()
    inMemoryInstitutionMembersRepository = new InMemoryInstitutionMembersRepository()
    inMemoryPreferenceTagsRepository = new InMemoryPreferenceTagsRepository()
    inMemoryProjectsRepository = new InMemoryProjectsRepository()

    sut = new ExportUserDataUseCase(
      inMemoryUsersRepository,
      inMemoryAccountsRepository,
      inMemorySessionsRepository,
      inMemoryInstitutionMembersRepository,
      inMemoryPreferenceTagsRepository,
      inMemoryProjectsRepository,
    )
  })

  it('should be able to export user data', async () => {
    const { user } = makeUser({
      name: 'João Silva',
      email: 'joao@example.com',
    })

    await inMemoryUsersRepository.create(user)

    const result = await sut.execute({
      userId: user.id.toString(),
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.userData.user).toEqual(
        expect.objectContaining({
          id: user.id.toString(),
          name: 'João Silva',
          email: 'joao@example.com',
        }),
      )
      expect(result.value.userData.institutions).toBeDefined()
      expect(result.value.userData.preferences).toBeDefined()
      expect(result.value.userData.projects).toBeDefined()
    }
  })

  it('should not be able to export data from a non-existing user', async () => {
    const result = await sut.execute({
      userId: 'non-existing-user-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotFoundError)
  })
})
