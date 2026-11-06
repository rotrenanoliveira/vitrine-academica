import { makeCall } from '@tests/factories/make-call'
import { makeCallSkill } from '@tests/factories/make-call-skill'
import { InMemoryCallSkillsRepository } from '@tests/repositories/in-memory-call-skills-repository'
import { InMemoryCallsRepository } from '@tests/repositories/in-memory-calls-repository'
import { InMemoryTagsRepository } from '@tests/repositories/in-memory-tags-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Slug } from '@/core/entities/value-objects/slug'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import { Tag } from '@/domain/tag/enterprise/entities/tag'
import type { CallProps } from '../../../enterprise/entities/call'
import { FetchCallsUseCase } from './fetch-calls'

let callsRepository: InMemoryCallsRepository
let callSkillsRepository: InMemoryCallSkillsRepository
let tagsRepository: InMemoryTagsRepository
let sut: FetchCallsUseCase

const DAY_IN_MS = 24 * 60 * 60 * 1000

function daysFromNow(days: number) {
  return new Date(Date.now() + days * DAY_IN_MS)
}

function addTag(name: string) {
  const tag = Tag.create({ name, slug: Slug.createFromText(name) })
  tagsRepository.items.push(tag)

  return tag
}

function addCall(tag: Tag, override: Partial<CallProps> = {}) {
  const { call } = makeCall(override)
  const { callSkill } = makeCallSkill({ callId: call.id, tagId: tag.id })

  callsRepository.items.push(call)
  callSkillsRepository.items.push(callSkill)

  return { call, callSkill }
}

describe('(UC) - Fetch Calls', () => {
  beforeEach(() => {
    callsRepository = new InMemoryCallsRepository()
    callSkillsRepository = new InMemoryCallSkillsRepository()
    tagsRepository = new InMemoryTagsRepository()
    sut = new FetchCallsUseCase(callsRepository, callSkillsRepository, tagsRepository)
  })

  it('should return only open calls that are still within the deadline', async () => {
    const tag = addTag('Backend')
    const { call: openCall } = addCall(tag)
    const { call: closedCall } = addCall(tag)
    closedCall.close()
    addCall(tag, { applicationDeadline: daysFromNow(-1) })

    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.calls).toHaveLength(1)
      expect(result.value.calls[0].call.id.toString()).toBe(openCall.id.toString())
    }
  })

  it('should return the skills of each call', async () => {
    const tag = addTag('Backend')
    const { callSkill } = addCall(tag)

    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.calls[0].skills).toHaveLength(1)
      expect(result.value.calls[0].skills[0].id.toString()).toBe(callSkill.id.toString())
    }
  })

  it('should return the newest calls first', async () => {
    const tag = addTag('Backend')
    const { call: olderCall } = addCall(tag, { createdAt: new Date('2026-01-01T00:00:00Z') })
    const { call: newerCall } = addCall(tag, { createdAt: new Date('2026-02-01T00:00:00Z') })

    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.calls.map(({ call }) => call.id.toString())).toEqual([
        newerCall.id.toString(),
        olderCall.id.toString(),
      ])
    }
  })

  it('should be able to filter calls by tag', async () => {
    const backend = addTag('Backend')
    const design = addTag('Design')
    const { call: backendCall } = addCall(backend)
    addCall(design)

    const result = await sut.execute({ tagId: backend.id.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.calls).toHaveLength(1)
      expect(result.value.calls[0].call.id.toString()).toBe(backendCall.id.toString())
    }
  })

  it('should not return closed or expired calls when filtering by tag', async () => {
    const tag = addTag('Backend')
    const { call: openCall } = addCall(tag)
    const { call: closedCall } = addCall(tag)
    closedCall.close()
    addCall(tag, { applicationDeadline: daysFromNow(-1) })

    const result = await sut.execute({ tagId: tag.id.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.calls).toHaveLength(1)
      expect(result.value.calls[0].call.id.toString()).toBe(openCall.id.toString())
    }
  })

  it('should not be able to filter by a tag that does not exist', async () => {
    const result = await sut.execute({ tagId: new UniqueEntityId().toString() })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(TagNotFoundError)
    }
  })
})
