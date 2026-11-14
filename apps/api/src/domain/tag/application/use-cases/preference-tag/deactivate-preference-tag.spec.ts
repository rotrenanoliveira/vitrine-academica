import { makePreferenceTag } from '@tests/factories/make-preference-tag'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryPreferenceTagsRepository } from '@tests/repositories/in-memory-preference-tags-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { PreferenceTagStatus } from '@/domain/tag/enterprise/entities/preference-tag'
import { PreferenceTagNotFoundError } from '../../_errors/preference-tag-not-found-error'
import { DeactivatePreferenceTagUseCase } from './deactivate-preference-tag'

let preferenceTagsRepository: InMemoryPreferenceTagsRepository
let usersRepository: InMemoryUsersRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let registerLog: RegisterLogUseCase

let sut: DeactivatePreferenceTagUseCase

describe('(UC) - Deactivate Preference Tag', () => {
  beforeEach(() => {
    preferenceTagsRepository = new InMemoryPreferenceTagsRepository()
    usersRepository = new InMemoryUsersRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    registerLog = new RegisterLogUseCase(auditLogsRepository)

    sut = new DeactivatePreferenceTagUseCase(preferenceTagsRepository, usersRepository, registerLog)
  })

  it('pode desativar uma preferência de tag', async () => {
    const { user } = makeUser()
    usersRepository.items.push(user)

    const { preferenceTag } = makePreferenceTag({ userId: user.id })
    preferenceTagsRepository.items.push(preferenceTag)

    const result = await sut.execute({
      userId: user.id.toString(),
      tagId: preferenceTag.tagId.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    expect(preferenceTagsRepository.items[0].status).toBe(PreferenceTagStatus.INACTIVE)
  })

  it('should register an audit log when a preference tag is deactivated', async () => {
    const { user } = makeUser()
    usersRepository.items.push(user)

    const { preferenceTag } = makePreferenceTag({ userId: user.id })
    preferenceTagsRepository.items.push(preferenceTag)

    await sut.execute({
      userId: user.id.toString(),
      tagId: preferenceTag.tagId.toString(),
    })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.UPDATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('não altera nada quando a preferência já está inativa', async () => {
    const { user } = makeUser()
    usersRepository.items.push(user)

    const { preferenceTag } = makePreferenceTag({ userId: user.id, status: PreferenceTagStatus.INACTIVE })
    preferenceTagsRepository.items.push(preferenceTag)

    const result = await sut.execute({
      userId: user.id.toString(),
      tagId: preferenceTag.tagId.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    expect(preferenceTagsRepository.items[0].status).toBe(PreferenceTagStatus.INACTIVE)
    expect(auditLogsRepository.items).toHaveLength(0)
  })

  it('não pode desativar uma preferência quando o usuário não existe', async () => {
    const result = await sut.execute({
      userId: new UniqueEntityId().toString(),
      tagId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('não pode desativar uma preferência que o usuário não possui', async () => {
    const { user } = makeUser()
    usersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      tagId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(PreferenceTagNotFoundError)
    }
  })
})
