import { makeAccount } from '@tests/factories/make-account'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAccountsRepository } from '@tests/repositories/in-memory-accounts-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { AccountNotFoundError } from '../../_errors/account-not-found-error'
import { UserNotFoundError } from '../../_errors/user-not-found-error'
import { FindUserByIdUseCase } from './find-user-by-id'

let usersRepository: InMemoryUsersRepository
let accountsRepository: InMemoryAccountsRepository
let sut: FindUserByIdUseCase

describe('(UC) Find User By Id  ', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    accountsRepository = new InMemoryAccountsRepository()
    sut = new FindUserByIdUseCase(usersRepository, accountsRepository)
  })

  it('should be able to find a user by id', async () => {
    const { user } = makeUser()
    usersRepository.items.push(user)

    const { account } = makeAccount({ userId: user.id })
    accountsRepository.items.push(account)

    const userId = user.id.toString()

    const result = await sut.execute({
      userId,
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.user.id.toString()).toBe(userId)
    }
  })

  it('should not be able to find a user by id if the user does not exist', async () => {
    const result = await sut.execute({
      userId: 'non-existing-user-id',
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should not be able to find a user by id if the account does not exist', async () => {
    const { user } = makeUser()
    usersRepository.items.push(user)
    const userId = user.id.toString()

    const result = await sut.execute({
      userId,
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(AccountNotFoundError)
    }
  })
})
