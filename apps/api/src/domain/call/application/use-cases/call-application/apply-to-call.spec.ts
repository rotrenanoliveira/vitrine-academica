import { makeCall } from '@tests/factories/make-call'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryCallApplicationsRepository } from '@tests/repositories/in-memory-call-applications-repository'
import { InMemoryCallsRepository } from '@tests/repositories/in-memory-calls-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { CallApplicationStatus } from '../../../enterprise/entities/call-application'
import { AlreadyAppliedToCallError } from '../../_errors/already-applied-to-call-error'
import { CallNotAcceptingApplicationsError } from '../../_errors/call-not-accepting-applications-error'
import { CallNotFoundError } from '../../_errors/call-not-found-error'
import { CannotApplyToOwnCallError } from '../../_errors/cannot-apply-to-own-call-error'
import { ApplyToCallUseCase } from './apply-to-call'

let callsRepository: InMemoryCallsRepository
let callApplicationsRepository: InMemoryCallApplicationsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: ApplyToCallUseCase

describe('(UC) - Apply To Call', () => {
  beforeEach(() => {
    callsRepository = new InMemoryCallsRepository()
    callApplicationsRepository = new InMemoryCallApplicationsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)
    sut = new ApplyToCallUseCase(callsRepository, callApplicationsRepository, registerLog)
  })

  it('should be able to apply to an open call', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)
    const applicantId = new UniqueEntityId().toString()

    const result = await sut.execute({
      callId: call.id.toString(),
      applicantId,
      message: 'Tenho experiência com Node.js',
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.application.callId.toString()).toBe(call.id.toString())
      expect(result.value.application.applicantId.toString()).toBe(applicantId)
      expect(result.value.application.message).toBe('Tenho experiência com Node.js')
      expect(result.value.application.status).toBe(CallApplicationStatus.PENDING)
      expect(result.value.application.decidedAt).toBeNull()
    }
    expect(callApplicationsRepository.items).toHaveLength(1)
  })

  it('should register an audit log when someone applies', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)

    await sut.execute({ callId: call.id.toString(), applicantId: new UniqueEntityId().toString() })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.CREATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('should be able to apply without a message or with a blank one', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)

    const withoutMessage = await sut.execute({
      callId: call.id.toString(),
      applicantId: new UniqueEntityId().toString(),
    })
    const blankMessage = await sut.execute({
      callId: call.id.toString(),
      applicantId: new UniqueEntityId().toString(),
      message: '   ',
    })

    expect(withoutMessage.isRight()).toBeTruthy()
    expect(blankMessage.isRight()).toBeTruthy()
    expect(callApplicationsRepository.items.map((application) => application.message)).toEqual([null, null])
  })

  it('should allow different users to apply to the same call', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)

    await sut.execute({ callId: call.id.toString(), applicantId: new UniqueEntityId().toString() })
    await sut.execute({ callId: call.id.toString(), applicantId: new UniqueEntityId().toString() })

    expect(callApplicationsRepository.items).toHaveLength(2)
  })

  it('should not be able to apply to a call that does not exist', async () => {
    const result = await sut.execute({ callId: 'non-existent', applicantId: new UniqueEntityId().toString() })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CallNotFoundError)
    }
  })

  it('should not be able to apply to your own call', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)

    const result = await sut.execute({ callId: call.id.toString(), applicantId: call.authorId.toString() })

    expect(result.isLeft()).toBeTruthy()
    expect(callApplicationsRepository.items).toHaveLength(0)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CannotApplyToOwnCallError)
    }
  })

  it('should not be able to apply to a closed call', async () => {
    const { call } = makeCall()
    call.close()
    callsRepository.items.push(call)

    const result = await sut.execute({ callId: call.id.toString(), applicantId: new UniqueEntityId().toString() })

    expect(result.isLeft()).toBeTruthy()
    expect(callApplicationsRepository.items).toHaveLength(0)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CallNotAcceptingApplicationsError)
    }
  })

  it('should not be able to apply after the deadline', async () => {
    const { call } = makeCall({ applicationDeadline: new Date(Date.now() - 1000) })
    callsRepository.items.push(call)

    const result = await sut.execute({ callId: call.id.toString(), applicantId: new UniqueEntityId().toString() })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CallNotAcceptingApplicationsError)
    }
  })

  it('should not be able to apply twice to the same call', async () => {
    const { call } = makeCall()
    callsRepository.items.push(call)
    const applicantId = new UniqueEntityId().toString()

    await sut.execute({ callId: call.id.toString(), applicantId })
    const result = await sut.execute({ callId: call.id.toString(), applicantId })

    expect(result.isLeft()).toBeTruthy()
    expect(callApplicationsRepository.items).toHaveLength(1)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(AlreadyAppliedToCallError)
    }
  })
})
