import { makeTag } from '@tests/factories/make-tag'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryPreferenceTagsRepository } from '@tests/repositories/in-memory-preference-tags-repository'
import { InMemoryTagsRepository } from '@tests/repositories/in-memory-tags-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { PreferenceTagAlreadyExistsError } from '../../_errors/preference-tag-already-exists-error'
import { TagNotFoundError } from '../../_errors/tag-not-found-error'
import { RegisterPreferenceTagUseCase } from './register-preference-tag'

let preferenceTagsRepository: InMemoryPreferenceTagsRepository
let tagsRepository: InMemoryTagsRepository
let usersRepository: InMemoryUsersRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let registerLog: RegisterLogUseCase

let sut: RegisterPreferenceTagUseCase

describe('(UC) - Register Preference Tag', () => {
  beforeEach(() => {
    preferenceTagsRepository = new InMemoryPreferenceTagsRepository()
    tagsRepository = new InMemoryTagsRepository()
    usersRepository = new InMemoryUsersRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    registerLog = new RegisterLogUseCase(auditLogsRepository)

    sut = new RegisterPreferenceTagUseCase(preferenceTagsRepository, tagsRepository, usersRepository, registerLog)
  })

  it('pode registrar uma preferência de tag', async () => {
    const { user } = makeUser()
    const { tag } = makeTag()
    usersRepository.items.push(user)
    tagsRepository.items.push(tag)

    const result = await sut.execute({
      userId: user.id.toString(),
      tagId: tag.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.preferenceTag.userId.toString()).toBe(user.id.toString())
      expect(result.value.preferenceTag.tagId.toString()).toBe(tag.id.toString())
      expect(preferenceTagsRepository.items).toHaveLength(1)
    }
  })

  it('should register an audit log when a preference tag is created', async () => {
    const { user } = makeUser()
    const { tag } = makeTag()
    usersRepository.items.push(user)
    tagsRepository.items.push(tag)

    await sut.execute({
      userId: user.id.toString(),
      tagId: tag.id.toString(),
    })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.CREATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('não deve registrar uma preferência de tag quando o usuário não existe', async () => {
    const { tag } = makeTag()
    tagsRepository.items.push(tag)

    const result = await sut.execute({
      userId: new UniqueEntityId().toString(),
      tagId: tag.id.toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('não pode registrar uma preferência de tag quando a tag não existe', async () => {
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
      expect(result.value).toBeInstanceOf(TagNotFoundError)
    }
  })

  it('não pode registrar uma preferência de tag que já foi registrada', async () => {
    const { user } = makeUser()
    const { tag } = makeTag()
    usersRepository.items.push(user)
    tagsRepository.items.push(tag)

    await sut.execute({
      userId: user.id.toString(),
      tagId: tag.id.toString(),
    })

    const result = await sut.execute({
      userId: user.id.toString(),
      tagId: tag.id.toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(2)
    expect(auditLogsRepository.items[1].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(PreferenceTagAlreadyExistsError)
    }
  })
})
