import { FakeHasher } from '@tests/cryptography/fake-hasher'
import { makeAccessCode } from '@tests/factories/make-access-code'
import { makeAccount } from '@tests/factories/make-account'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAccessCodesRepository } from '@tests/repositories/in-memory-access-codes-repository'
import { InMemoryAccountsRepository } from '@tests/repositories/in-memory-accounts-repository'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemorySessionsRepository } from '@tests/repositories/in-memory-sessions-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { UserStatus } from '../../../enterprise/entities/user'
import { ExpiredAccessCodeError } from '../../_errors/expired-access-code-error'
import { InvalidAccessCodeError } from '../../_errors/invalid-access-code-error'
import { UserNotFoundError } from '../../_errors/user-not-found-error'
import { UserUnavailableError } from '../../_errors/user-unavailable-error'
import { AuthenticateWithAccessCodeUseCase } from './authenticate-with-access-code'

let usersRepository: InMemoryUsersRepository
let accountsRepository: InMemoryAccountsRepository
let accessCodesRepository: InMemoryAccessCodesRepository
let sessionsRepository: InMemorySessionsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let hasher: FakeHasher
let registerLog: RegisterLogUseCase
let sut: AuthenticateWithAccessCodeUseCase

async function seedPendingUserWithCode(plainCode = '123456') {
  const { user } = makeUser({ status: UserStatus.PENDING })
  const { account } = makeAccount({ userId: user.id, confirmationAt: null })
  const codeHash = await hasher.hash(plainCode)
  const { accessCode } = makeAccessCode({
    accountId: account.id,
    codeHash,
  })

  usersRepository.items.push(user)
  accountsRepository.items.push(account)
  accessCodesRepository.items.push(accessCode)

  return { user, account, accessCode, plainCode }
}

describe('(UC) - Authenticate With Access Code', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    accountsRepository = new InMemoryAccountsRepository()
    accessCodesRepository = new InMemoryAccessCodesRepository()
    sessionsRepository = new InMemorySessionsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    registerLog = new RegisterLogUseCase(auditLogsRepository)
    hasher = new FakeHasher()
    sut = new AuthenticateWithAccessCodeUseCase(
      usersRepository,
      accountsRepository,
      accessCodesRepository,
      sessionsRepository,
      hasher,
      registerLog,
    )
  })

  it('should be able to authenticate with a valid access code and create a session', async () => {
    const { user, plainCode } = await seedPendingUserWithCode()

    const result = await sut.execute({ email: user.email, code: plainCode })

    expect(result.isRight()).toBeTruthy()
    expect(sessionsRepository.items).toHaveLength(1)

    if (result.isRight()) {
      expect(result.value.session.userId.toString()).toBe(user.id.toString())
      expect(result.value.session.isRevoked()).toBeFalsy()
    }
  })

  it('should register an audit log when authentication succeeds', async () => {
    const { user, plainCode } = await seedPendingUserWithCode()

    await sut.execute({ email: user.email, code: plainCode })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.LOGIN)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('should be able to activate a pending user and set confirmationAt on first login', async () => {
    const { user, account, plainCode } = await seedPendingUserWithCode()

    expect(user.status).toBe(UserStatus.PENDING)
    expect(account.confirmationAt).toBeNull()

    const result = await sut.execute({ email: user.email, code: plainCode })

    expect(result.isRight()).toBeTruthy()
    expect(user.status).toBe(UserStatus.ACTIVE)
    expect(account.confirmationAt).toBeInstanceOf(Date)
  })

  it('should not be able to authenticate when user does not exist', async () => {
    const result = await sut.execute({ email: 'missing@example.com', code: '123456' })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(0)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should not be able to authenticate when user is unavailable', async () => {
    const { user } = makeUser({ status: UserStatus.BLOCKED })
    const { account } = makeAccount({ userId: user.id })

    usersRepository.items.push(user)
    accountsRepository.items.push(account)

    const result = await sut.execute({ email: user.email, code: '123456' })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserUnavailableError)
    }
  })

  it('should not be able to authenticate with an invalid access code', async () => {
    const { user } = await seedPendingUserWithCode('123456')

    const result = await sut.execute({ email: user.email, code: '000000' })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidAccessCodeError)
    }
  })

  it('should not be able to authenticate with an expired access code', async () => {
    const { user } = makeUser()
    const { account } = makeAccount({ userId: user.id })
    const plainCode = '123456'
    const codeHash = await hasher.hash(plainCode)
    const { accessCode } = makeAccessCode({
      accountId: account.id,
      codeHash,
      expiresAt: new Date(Date.now() - 60_000),
    })

    usersRepository.items.push(user)
    accountsRepository.items.push(account)
    accessCodesRepository.items.push(accessCode)

    const result = await sut.execute({ email: user.email, code: plainCode })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ExpiredAccessCodeError)
    }
  })
})
