import { makeUser } from '@tests/factories/make-user'
import { InMemoryAccountsRepository } from '@tests/repositories/in-memory-accounts-repository'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { UserAlreadyExistsError } from '../../_errors/user-already-exists-error'
import { RegisterUserUseCase } from './register-user'

let usersRepository: InMemoryUsersRepository
let accountsRepository: InMemoryAccountsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: RegisterUserUseCase

describe('(UC) - Register User', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    accountsRepository = new InMemoryAccountsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)
    sut = new RegisterUserUseCase(usersRepository, accountsRepository, registerLog)
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

  it('should register an audit log when a user is created', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: 'johndoe@example.com',
    })

    expect(result.isRight()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
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

  it('should register a failure audit log when registration fails', async () => {
    await sut.execute({ name: 'John Doe', email: 'john.doe@example.com' })

    const result = await sut.execute({
      name: 'John Doe',
      email: 'john.doe@example.com',
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(2)
    expect(auditLogsRepository.items[1].status).toBe(AuditLogStatus.FAILURE)
  })
})
