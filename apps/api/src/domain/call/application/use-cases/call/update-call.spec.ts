import { makeCall } from '@tests/factories/make-call'
import { makeCallSkill } from '@tests/factories/make-call-skill'
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
import type { Call, CallProps } from '../../../enterprise/entities/call'
import { CallNotFoundError } from '../../_errors/call-not-found-error'
import { CallSkillsRequiredError } from '../../_errors/call-skills-required-error'
import { InvalidCallDeadlineError } from '../../_errors/invalid-call-deadline-error'
import { InvalidCallStatusError } from '../../_errors/invalid-call-status-error'
import { NotCallOwnerError } from '../../_errors/not-call-owner-error'
import { UpdateCallUseCase } from './update-call'

let callsRepository: InMemoryCallsRepository
let callSkillsRepository: InMemoryCallSkillsRepository
let tagsRepository: InMemoryTagsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: UpdateCallUseCase

const DAY_IN_MS = 24 * 60 * 60 * 1000

function daysFromNow(days: number) {
  return new Date(Date.now() + days * DAY_IN_MS)
}

function addTag(name: string) {
  const tag = Tag.create({ name, slug: Slug.createFromText(name) })
  tagsRepository.items.push(tag)

  return tag
}

function seedCall(override: Partial<CallProps> = {}) {
  const tag = addTag('Backend')
  const { call } = makeCall(override)
  const { callSkill } = makeCallSkill({ callId: call.id, tagId: tag.id })

  callsRepository.items.push(call)
  callSkillsRepository.items.push(callSkill)

  return { call, tag, callSkill }
}

function baseRequest(call: Call) {
  return {
    callId: call.id.toString(),
    authorId: call.authorId.toString(),
    title: call.title,
    description: call.description,
    applicationDeadline: call.applicationDeadline,
  }
}

describe('(UC) - Update Call', () => {
  beforeEach(() => {
    callsRepository = new InMemoryCallsRepository()
    callSkillsRepository = new InMemoryCallSkillsRepository()
    tagsRepository = new InMemoryTagsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)
    sut = new UpdateCallUseCase(callsRepository, callSkillsRepository, tagsRepository, registerLog)
  })

  it('should be able to update a call as owner', async () => {
    const { call } = seedCall()
    const newDeadline = daysFromNow(14)

    const result = await sut.execute({
      ...baseRequest(call),
      title: 'Novo título',
      description: 'Nova descrição',
      applicationDeadline: newDeadline,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.call.title).toBe('Novo título')
      expect(result.value.call.description).toBe('Nova descrição')
      expect(result.value.call.applicationDeadline).toEqual(newDeadline)
    }
  })

  it('should register an audit log when a call is updated', async () => {
    const { call } = seedCall()

    await sut.execute({ ...baseRequest(call), title: 'Novo título' })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.UPDATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('should keep the current skills when skills are not informed', async () => {
    const { call, callSkill } = seedCall()

    const result = await sut.execute({ ...baseRequest(call), title: 'Novo título' })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.skills).toHaveLength(1)
      expect(result.value.skills[0].id.toString()).toBe(callSkill.id.toString())
    }
    expect(callSkillsRepository.items).toHaveLength(1)
  })

  it('should replace the skills when new skills are informed', async () => {
    const { call } = seedCall()
    const newTag = addTag('Design')

    const result = await sut.execute({
      ...baseRequest(call),
      skills: [{ tagId: newTag.id.toString(), description: 'Figma' }],
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.skills).toHaveLength(1)
      expect(result.value.skills[0].tagId.toString()).toBe(newTag.id.toString())
      expect(result.value.skills[0].description).toBe('Figma')
    }
    expect(callSkillsRepository.items).toHaveLength(1)
    expect(callSkillsRepository.items[0].tagId.toString()).toBe(newTag.id.toString())
  })

  it('should be able to update an open call whose deadline has already passed when the deadline is kept', async () => {
    const { call } = seedCall({ applicationDeadline: daysFromNow(-1) })

    const result = await sut.execute({ ...baseRequest(call), title: 'Título corrigido' })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.call.title).toBe('Título corrigido')
    }
  })

  it('should not be able to update a call as non-owner', async () => {
    const { call } = seedCall()

    const result = await sut.execute({
      ...baseRequest(call),
      authorId: new UniqueEntityId().toString(),
      title: 'Hack',
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    expect(callsRepository.items[0].title).not.toBe('Hack')
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotCallOwnerError)
    }
  })

  it('should not be able to update a call that does not exist', async () => {
    const result = await sut.execute({
      callId: 'non-existent',
      authorId: new UniqueEntityId().toString(),
      title: 'Título',
      description: 'Descrição',
      applicationDeadline: daysFromNow(7),
    })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CallNotFoundError)
    }
  })

  it('should not be able to update a closed call', async () => {
    const { call } = seedCall()
    call.close()

    const result = await sut.execute({ ...baseRequest(call), title: 'Novo título' })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCallStatusError)
    }
  })

  it('should not be able to change the deadline to a past date', async () => {
    const { call } = seedCall()

    const result = await sut.execute({ ...baseRequest(call), applicationDeadline: daysFromNow(-1) })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCallDeadlineError)
    }
  })

  it('should not be able to remove all the skills of a call', async () => {
    const { call } = seedCall()

    const result = await sut.execute({ ...baseRequest(call), skills: [] })

    expect(result.isLeft()).toBeTruthy()
    expect(callSkillsRepository.items).toHaveLength(1)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CallSkillsRequiredError)
    }
  })

  it('should not be able to update the skills with a tag that does not exist', async () => {
    const { call, tag } = seedCall()

    const result = await sut.execute({
      ...baseRequest(call),
      skills: [{ tagId: new UniqueEntityId().toString() }],
    })

    expect(result.isLeft()).toBeTruthy()
    expect(callSkillsRepository.items).toHaveLength(1)
    expect(callSkillsRepository.items[0].tagId.toString()).toBe(tag.id.toString())
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(TagNotFoundError)
    }
  })
})
