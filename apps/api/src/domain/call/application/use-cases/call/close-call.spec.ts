import { makeCall } from '@tests/factories/make-call'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryCallsRepository } from '@tests/repositories/in-memory-calls-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { CallStatus } from '../../../enterprise/entities/call'
import { CallNotFoundError } from '../../_errors/call-not-found-error'
import { InvalidCallStatusError } from '../../_errors/invalid-call-status-error'
import { NotCallOwnerError } from '../../_errors/not-call-owner-error'
import { CloseCallUseCase } from './close-call'

let callsRepository: InMemoryCallsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: CloseCallUseCase

describe('(UC) - Close Call', () => {
  beforeEach(() => {
    callsRepository = new InMemoryCallsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)
    sut = new CloseCallUseCase(callsRepository, registerLog)
  })

  it('should be able to close a call as owner', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)

    const result = await sut.execute({ callId: call.id.toString(), authorId: call.authorId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.call.status).toBe(CallStatus.CLOSED)
    }
    expect(callsRepository.items[0].status).toBe(CallStatus.CLOSED)
  })

  it('should register an audit log when a call is closed', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)

    await sut.execute({ callId: call.id.toString(), authorId: call.authorId.toString() })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.UPDATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('should not be able to close a call as non-owner', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)

    const result = await sut.execute({ callId: call.id.toString(), authorId: new UniqueEntityId().toString() })

    expect(result.isLeft()).toBeTruthy()
    expect(callsRepository.items[0].status).toBe(CallStatus.OPEN)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotCallOwnerError)
    }
  })

  it('should not be able to close a call that does not exist', async () => {
    const result = await sut.execute({ callId: 'non-existent', authorId: new UniqueEntityId().toString() })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CallNotFoundError)
    }
  })

  it('should not be able to close a call that is already closed', async () => {
    const { call } = makeCall()
    call.close()
    callsRepository.items.push(call)

    const result = await sut.execute({ callId: call.id.toString(), authorId: call.authorId.toString() })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCallStatusError)
    }
  })
})
