import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryCallSkillsRepository } from '@tests/repositories/in-memory-call-skills-repository'
import { InMemoryCallsRepository } from '@tests/repositories/in-memory-calls-repository'
import { InMemoryTagsRepository } from '@tests/repositories/in-memory-tags-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Slug } from '@/core/entities/value-objects/slug'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import { Tag } from '@/domain/tag/enterprise/entities/tag'
import { CallStatus } from '../../../enterprise/entities/call'
import { CallSkillsRequiredError } from '../../_errors/call-skills-required-error'
import { InvalidCallDeadlineError } from '../../_errors/invalid-call-deadline-error'
import { RegisterCallUseCase } from './register-call'

let callsRepository: InMemoryCallsRepository
let callSkillsRepository: InMemoryCallSkillsRepository
let tagsRepository: InMemoryTagsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: RegisterCallUseCase

const DAY_IN_MS = 24 * 60 * 60 * 1000

function daysFromNow(days: number) {
  return new Date(Date.now() + days * DAY_IN_MS)
}

function addTag(name: string) {
  const tag = Tag.create({ name, slug: Slug.createFromText(name) })
  tagsRepository.items.push(tag)

  return tag
}

describe('(UC) - Register Call', () => {
  beforeEach(() => {
    callsRepository = new InMemoryCallsRepository()
    callSkillsRepository = new InMemoryCallSkillsRepository()
    tagsRepository = new InMemoryTagsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)
    sut = new RegisterCallUseCase(callsRepository, callSkillsRepository, tagsRepository, registerLog)
  })

  it('should be able to register a call with skills', async () => {
    const authorId = new UniqueEntityId().toString()
    const tag = addTag('Backend')

    const result = await sut.execute({
      authorId,
      title: 'Busco dev para API',
      description: 'Projeto de extensão que precisa de um desenvolvedor backend',
      applicationDeadline: daysFromNow(7),
      skills: [{ tagId: tag.id.toString(), description: 'Node.js' }],
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.call.authorId.toString()).toBe(authorId)
      expect(result.value.call.status).toBe(CallStatus.OPEN)
      expect(result.value.skills).toHaveLength(1)
      expect(result.value.skills[0].tagId.toString()).toBe(tag.id.toString())
      expect(result.value.skills[0].description).toBe('Node.js')
    }
    expect(callsRepository.items).toHaveLength(1)
    expect(callSkillsRepository.items).toHaveLength(1)
  })

  it('should register an audit log when a call is created', async () => {
    const tag = addTag('Backend')

    await sut.execute({
      authorId: new UniqueEntityId().toString(),
      title: 'Busco dev',
      description: 'Descrição',
      applicationDeadline: daysFromNow(7),
      skills: [{ tagId: tag.id.toString() }],
    })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.CREATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('should ignore duplicated tags in the skills', async () => {
    const tag = addTag('Backend')

    const result = await sut.execute({
      authorId: new UniqueEntityId().toString(),
      title: 'Busco dev',
      description: 'Descrição',
      applicationDeadline: daysFromNow(7),
      skills: [{ tagId: tag.id.toString() }, { tagId: tag.id.toString(), description: 'repetida' }],
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.skills).toHaveLength(1)
      expect(result.value.skills[0].description).toBeNull()
    }
    expect(callSkillsRepository.items).toHaveLength(1)
  })

  it('should not be able to register a call without skills', async () => {
    const result = await sut.execute({
      authorId: new UniqueEntityId().toString(),
      title: 'Busco dev',
      description: 'Descrição',
      applicationDeadline: daysFromNow(7),
      skills: [],
    })

    expect(result.isLeft()).toBeTruthy()
    expect(callsRepository.items).toHaveLength(0)
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CallSkillsRequiredError)
    }
  })

  it('should not be able to register a call with a past deadline', async () => {
    const tag = addTag('Backend')

    const result = await sut.execute({
      authorId: new UniqueEntityId().toString(),
      title: 'Busco dev',
      description: 'Descrição',
      applicationDeadline: daysFromNow(-1),
      skills: [{ tagId: tag.id.toString() }],
    })

    expect(result.isLeft()).toBeTruthy()
    expect(callsRepository.items).toHaveLength(0)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCallDeadlineError)
    }
  })

  it('should not be able to register a call with a tag that does not exist', async () => {
    const result = await sut.execute({
      authorId: new UniqueEntityId().toString(),
      title: 'Busco dev',
      description: 'Descrição',
      applicationDeadline: daysFromNow(7),
      skills: [{ tagId: new UniqueEntityId().toString() }],
    })

    expect(result.isLeft()).toBeTruthy()
    expect(callsRepository.items).toHaveLength(0)
    expect(callSkillsRepository.items).toHaveLength(0)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(TagNotFoundError)
    }
  })
})
