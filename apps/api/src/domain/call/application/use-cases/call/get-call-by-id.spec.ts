import { makeCall } from '@tests/factories/make-call'
import { makeCallSkill } from '@tests/factories/make-call-skill'
import { InMemoryCallSkillsRepository } from '@tests/repositories/in-memory-call-skills-repository'
import { InMemoryCallsRepository } from '@tests/repositories/in-memory-calls-repository'
import { CallNotFoundError } from '../../_errors/call-not-found-error'
import { GetCallByIdUseCase } from './get-call-by-id'

let callsRepository: InMemoryCallsRepository
let callSkillsRepository: InMemoryCallSkillsRepository
let sut: GetCallByIdUseCase

describe('(UC) - Get Call By Id', () => {
  beforeEach(() => {
    callsRepository = new InMemoryCallsRepository()
    callSkillsRepository = new InMemoryCallSkillsRepository()
    sut = new GetCallByIdUseCase(callsRepository, callSkillsRepository)
  })

  it('should be able to get a call with its skills', async () => {
    const { call } = makeCall()
    const { callSkill } = makeCallSkill({ callId: call.id })
    callsRepository.items.push(call)
    callSkillsRepository.items.push(callSkill)

    const result = await sut.execute({ callId: call.id.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.call.id.toString()).toBe(call.id.toString())
      expect(result.value.skills).toHaveLength(1)
    }
  })

  it('should be able to get a closed call', async () => {
    const { call } = makeCall()
    call.close()
    callsRepository.items.push(call)

    const result = await sut.execute({ callId: call.id.toString() })

    expect(result.isRight()).toBeTruthy()
  })

  it('should not be able to get a call that does not exist', async () => {
    const result = await sut.execute({ callId: 'non-existent' })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CallNotFoundError)
    }
  })
})
