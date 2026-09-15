import { FakeHasher } from '@tests/cryptography/fake-hasher'
import { makeAccessCode } from '@tests/factories/make-access-code'
import { makeAccount } from '@tests/factories/make-account'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAccessCodesRepository } from '@tests/repositories/in-memory-access-codes-repository'
import { InMemoryAccountsRepository } from '@tests/repositories/in-memory-accounts-repository'
import { InMemoryMail } from '@tests/repositories/in-memory-mail'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { UserStatus } from '../../../enterprise/entities/user'
import { AccountNotFoundError } from '../../_errors/account-not-found-error'
import { UserNotFoundError } from '../../_errors/user-not-found-error'
import { UserUnavailableError } from '../../_errors/user-unavailable-error'
import { RequestAccessCodeUseCase } from './request-access-code'

let usersRepository: InMemoryUsersRepository
let accountsRepository: InMemoryAccountsRepository
let accessCodesRepository: InMemoryAccessCodesRepository
let hasher: FakeHasher
let mail: InMemoryMail
let sut: RequestAccessCodeUseCase

describe('(UC) - Request Access Code', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    accountsRepository = new InMemoryAccountsRepository()
    accessCodesRepository = new InMemoryAccessCodesRepository()
    hasher = new FakeHasher()
    mail = new InMemoryMail()
    sut = new RequestAccessCodeUseCase(usersRepository, accountsRepository, accessCodesRepository, hasher, mail)
  })

  it('should be able to request an access code and send it by email', async () => {
    const { user } = makeUser()
    const { account } = makeAccount({ userId: user.id })

    usersRepository.items.push(user)
    accountsRepository.items.push(account)

    const result = await sut.execute({ email: user.email })

    expect(result.isRight()).toBeTruthy()
    expect(accessCodesRepository.items).toHaveLength(1)
    expect(accessCodesRepository.items[0].isConsumed()).toBeFalsy()
    expect(mail.items).toHaveLength(1)
    expect(mail.items[0].to).toBe(user.email)

    if (result.isRight()) {
      expect(result.value.accessCodeId.toString()).toBe(accessCodesRepository.items[0].id.toString())
    }
  })

  it('should be able to invalidate previous active access codes when requesting a new one', async () => {
    const { user } = makeUser()
    const { account } = makeAccount({ userId: user.id })
    const { accessCode: previousCode } = makeAccessCode({ accountId: account.id })

    usersRepository.items.push(user)
    accountsRepository.items.push(account)
    accessCodesRepository.items.push(previousCode)

    const result = await sut.execute({ email: user.email })

    expect(result.isRight()).toBeTruthy()
    expect(previousCode.isConsumed()).toBeTruthy()
    expect(accessCodesRepository.items).toHaveLength(2)
    expect(accessCodesRepository.items.filter((code) => !code.isConsumed())).toHaveLength(1)
  })

  it('should not be able to request an access code when user does not exist', async () => {
    const result = await sut.execute({ email: 'missing@example.com' })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should not be able to request an access code when account does not exist', async () => {
    const { user } = makeUser()
    usersRepository.items.push(user)

    const result = await sut.execute({ email: user.email })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(AccountNotFoundError)
    }
  })

  it('should not be able to request an access code when user is unavailable', async () => {
    const { user } = makeUser({ status: UserStatus.BLOCKED })
    const { account } = makeAccount({ userId: user.id })

    usersRepository.items.push(user)
    accountsRepository.items.push(account)

    const result = await sut.execute({ email: user.email })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserUnavailableError)
    }
  })
})
