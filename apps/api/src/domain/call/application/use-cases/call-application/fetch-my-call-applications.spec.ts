import { makeCall } from '@tests/factories/make-call'
import { makeCallApplication } from '@tests/factories/make-call-application'
import { InMemoryCallApplicationsRepository } from '@tests/repositories/in-memory-call-applications-repository'
import { InMemoryCallsRepository } from '@tests/repositories/in-memory-calls-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { FetchMyCallApplicationsUseCase } from './fetch-my-call-applications'

let callsRepository: InMemoryCallsRepository
let callApplicationsRepository: InMemoryCallApplicationsRepository
let sut: FetchMyCallApplicationsUseCase

describe('(UC) - Fetch My Call Applications', () => {
  beforeEach(() => {
    callsRepository = new InMemoryCallsRepository()
    callApplicationsRepository = new InMemoryCallApplicationsRepository()
    sut = new FetchMyCallApplicationsUseCase(callsRepository, callApplicationsRepository)
  })

  it('should return only my applications with the call, newest first', async () => {
    const applicantId = new UniqueEntityId()
    const { call: firstCall } = makeCall({ title: 'Primeiro chamado' })
    const { call: secondCall } = makeCall({ title: 'Segundo chamado' })
    const { call: otherCall } = makeCall()
    const { application: older } = makeCallApplication({
      callId: firstCall.id,
      applicantId,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    })
    const { application: newer } = makeCallApplication({
      callId: secondCall.id,
      applicantId,
      createdAt: new Date('2026-02-01T00:00:00Z'),
    })
    const { application: someoneElse } = makeCallApplication({ callId: otherCall.id })

    callsRepository.items.push(firstCall, secondCall, otherCall)
    callApplicationsRepository.items.push(older, newer, someoneElse)

    const result = await sut.execute({ applicantId: applicantId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.applications.map(({ application }) => application.id.toString())).toEqual([
        newer.id.toString(),
        older.id.toString(),
      ])
      expect(result.value.applications.map(({ call }) => call.title)).toEqual(['Segundo chamado', 'Primeiro chamado'])
    }
  })

  it('should return an empty list when the user has no applications', async () => {
    const result = await sut.execute({ applicantId: new UniqueEntityId().toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.applications).toEqual([])
    }
  })
})
