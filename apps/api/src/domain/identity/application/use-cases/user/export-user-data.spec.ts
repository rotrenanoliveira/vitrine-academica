import { makePointTransaction } from '@tests/factories/make-point-transaction'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAccountsRepository } from '@tests/repositories/in-memory-accounts-repository'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryPointTransactionsRepository } from '@tests/repositories/in-memory-point-transactions-repository'
import { InMemoryPreferenceTagsRepository } from '@tests/repositories/in-memory-preference-tags-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemorySessionsRepository } from '@tests/repositories/in-memory-sessions-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { PointTransactionReason, PointTransactionType } from '@/domain/points/enterprise/entities/point-transaction'
import { UserNotFoundError } from '../../_errors/user-not-found-error'
import { ExportUserDataUseCase } from './export-user-data'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryAccountsRepository: InMemoryAccountsRepository
let inMemorySessionsRepository: InMemorySessionsRepository
let inMemoryInstitutionMembersRepository: InMemoryInstitutionMembersRepository
let inMemoryPreferenceTagsRepository: InMemoryPreferenceTagsRepository
let inMemoryProjectsRepository: InMemoryProjectsRepository
let inMemoryPointTransactionsRepository: InMemoryPointTransactionsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: ExportUserDataUseCase

describe('Export User Data Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryAccountsRepository = new InMemoryAccountsRepository()
    inMemorySessionsRepository = new InMemorySessionsRepository()
    inMemoryInstitutionMembersRepository = new InMemoryInstitutionMembersRepository()
    inMemoryPreferenceTagsRepository = new InMemoryPreferenceTagsRepository()
    inMemoryProjectsRepository = new InMemoryProjectsRepository()
    inMemoryPointTransactionsRepository = new InMemoryPointTransactionsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()

    const registerLog = new RegisterLogUseCase(auditLogsRepository)

    sut = new ExportUserDataUseCase(
      inMemoryUsersRepository,
      inMemoryAccountsRepository,
      inMemorySessionsRepository,
      inMemoryInstitutionMembersRepository,
      inMemoryPreferenceTagsRepository,
      inMemoryProjectsRepository,
      inMemoryPointTransactionsRepository,
      registerLog,
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
      expect(result.value.userData.points).toEqual({ balance: 0, transactions: [] })
    }
  })

  it('should register an audit log when the data is exported', async () => {
    const { user } = makeUser()
    await inMemoryUsersRepository.create(user)

    await sut.execute({ userId: user.id.toString() })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.EXPORT)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('should export the points balance and the full transaction history', async () => {
    const { user } = makeUser()
    await inMemoryUsersRepository.create(user)

    const { pointTransaction: credit } = makePointTransaction({
      userId: user.id,
      type: PointTransactionType.CREDIT,
      amount: 5,
      reason: PointTransactionReason.STAR_RECEIVED,
    })
    const { pointTransaction: debit } = makePointTransaction({
      userId: user.id,
      type: PointTransactionType.DEBIT,
      amount: 2,
      reason: PointTransactionReason.PROMOTION,
    })
    const { pointTransaction: fromOtherUser } = makePointTransaction({ amount: 9 })

    inMemoryPointTransactionsRepository.items.push(credit, debit, fromOtherUser)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.userData.points.balance).toBe(3)
      expect(result.value.userData.points.transactions).toHaveLength(2)
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
