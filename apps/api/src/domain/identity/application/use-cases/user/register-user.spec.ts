import { makeUser } from '@tests/factories/make-user'
import { InMemoryAccountsRepository } from '@tests/repositories/in-memory-accounts-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UserAlreadyExistsError } from '../../_errors/user-already-exists-error'
import { RegisterUserUseCase } from './register-user'

let usersRepository: InMemoryUsersRepository
let accountsRepository: InMemoryAccountsRepository
let sut: RegisterUserUseCase

describe('(UC) - Register User', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    accountsRepository = new InMemoryAccountsRepository()
    sut = new RegisterUserUseCase(usersRepository, accountsRepository)
  })

  it('should be able to register a new user', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: 'johndoe@example.com',
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.user.id).toBeInstanceOf(UniqueEntityId)
      expect(result.value.user.name).toBe('John Doe')
      expect(result.value.user.email).toBe('johndoe@example.com')
      expect(result.value.accountId).toBeInstanceOf(UniqueEntityId)
    }
  })

  it('should be able to register the consent of user at registration', async () => {
    const { user } = makeUser()
    const result = await sut.execute({ name: user.name, email: user.email })

    assert(result.isRight())

    const { accountId, user: userResult } = result.value
    const accountOnDatabase = await accountsRepository.findByUserId(userResult.id.toString())

    assert(accountOnDatabase)

    expect(accountOnDatabase.userId).toEqual(userResult.id)
    expect(accountOnDatabase.id).toEqual(accountId)
    expect(accountOnDatabase.consentedAt).toStrictEqual(expect.any(Date))
  })

  it('should not be able to register a new user with same email', async () => {
    await sut.execute({ name: 'John Doe', email: 'john.doe@example.com' })

    const result = await sut.execute({
      name: 'John Doe',
      email: 'john.doe@example.com',
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserAlreadyExistsError)
    }
  })
})
