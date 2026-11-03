import { makeCall } from '@tests/factories/make-call'
import { makeCallSkill } from '@tests/factories/make-call-skill'
import { InMemoryCallSkillsRepository } from '@tests/repositories/in-memory-call-skills-repository'
import { InMemoryCallsRepository } from '@tests/repositories/in-memory-calls-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { FetchMyCallsUseCase } from './fetch-my-calls'

let callsRepository: InMemoryCallsRepository
let callSkillsRepository: InMemoryCallSkillsRepository
let sut: FetchMyCallsUseCase

describe('(UC) - Fetch My Calls', () => {
  beforeEach(() => {
    callsRepository = new InMemoryCallsRepository()
    callSkillsRepository = new InMemoryCallSkillsRepository()
    sut = new FetchMyCallsUseCase(callsRepository, callSkillsRepository)
  })

  it('should return the calls of the author in any status', async () => {
    const authorId = new UniqueEntityId()
    const { call: openCall } = makeCall({ authorId })
    const { call: closedCall } = makeCall({ authorId })
    closedCall.close()
    const { call: otherAuthorCall } = makeCall()
    callsRepository.items.push(openCall, closedCall, otherAuthorCall)

    const result = await sut.execute({ authorId: authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      const ids = result.value.calls.map(({ call }) => call.id.toString())

      expect(ids).toHaveLength(2)
      expect(ids).toContain(openCall.id.toString())
      expect(ids).toContain(closedCall.id.toString())
      expect(ids).not.toContain(otherAuthorCall.id.toString())
    }
  })

  it('should return the newest calls first with their skills', async () => {
    const authorId = new UniqueEntityId()
    const { call: olderCall } = makeCall({ authorId, createdAt: new Date('2026-01-01T00:00:00Z') })
    const { call: newerCall } = makeCall({ authorId, createdAt: new Date('2026-02-01T00:00:00Z') })
    const { callSkill } = makeCallSkill({ callId: newerCall.id })
    callsRepository.items.push(olderCall, newerCall)
    callSkillsRepository.items.push(callSkill)

    const result = await sut.execute({ authorId: authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.calls[0].call.id.toString()).toBe(newerCall.id.toString())
      expect(result.value.calls[0].skills).toHaveLength(1)
      expect(result.value.calls[1].call.id.toString()).toBe(olderCall.id.toString())
      expect(result.value.calls[1].skills).toHaveLength(0)
    }
  })

  it('should return an empty list when the author has no calls', async () => {
    const result = await sut.execute({ authorId: new UniqueEntityId().toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.calls).toEqual([])
    }
  })
})
