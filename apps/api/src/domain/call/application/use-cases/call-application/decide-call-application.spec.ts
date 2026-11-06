import { makeCall } from '@tests/factories/make-call'
import { makeCallApplication } from '@tests/factories/make-call-application'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryCallApplicationsRepository } from '@tests/repositories/in-memory-call-applications-repository'
import { InMemoryCallsRepository } from '@tests/repositories/in-memory-calls-repository'
import { InMemoryMail } from '@tests/repositories/in-memory-mail'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import type { Mail } from '@/domain/mail/application/mail/mail'
import { CallApplicationStatus } from '../../../enterprise/entities/call-application'
import { CallApplicationNotFoundError } from '../../_errors/call-application-not-found-error'
import { CallNotFoundError } from '../../_errors/call-not-found-error'
import { InvalidCallApplicationStatusError } from '../../_errors/invalid-call-application-status-error'
import { NotCallOwnerError } from '../../_errors/not-call-owner-error'
import { DecideCallApplicationUseCase } from './decide-call-application'

let callsRepository: InMemoryCallsRepository
let callApplicationsRepository: InMemoryCallApplicationsRepository
let usersRepository: InMemoryUsersRepository
let mail: InMemoryMail
let auditLogsRepository: InMemoryAuditLogsRepository
let registerLog: RegisterLogUseCase
let sut: DecideCallApplicationUseCase

function seed() {
  const { call } = makeCall({ title: 'Busco dev para API' })
  const { user } = makeUser({ name: 'Maria Silva', email: 'maria@email.com', status: UserStatus.ACTIVE })
  const { application } = makeCallApplication({ callId: call.id, applicantId: user.id })

  callsRepository.items.push(call)
  usersRepository.items.push(user)
  callApplicationsRepository.items.push(application)

  return { call, user, application }
}

describe('(UC) - Decide Call Application', () => {
  beforeEach(() => {
    callsRepository = new InMemoryCallsRepository()
    callApplicationsRepository = new InMemoryCallApplicationsRepository()
    usersRepository = new InMemoryUsersRepository()
    mail = new InMemoryMail()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    registerLog = new RegisterLogUseCase(auditLogsRepository)
    sut = new DecideCallApplicationUseCase(
      callsRepository,
      callApplicationsRepository,
      usersRepository,
      mail,
      registerLog,
    )
  })

  it('should be able to approve an application and notify the applicant', async () => {
    const { call, application } = seed()

    const result = await sut.execute({
      callId: call.id.toString(),
      applicationId: application.id.toString(),
      authorId: call.authorId.toString(),
      decision: CallApplicationStatus.APPROVED,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.application.status).toBe(CallApplicationStatus.APPROVED)
      expect(result.value.application.decidedAt).toBeTruthy()
      expect(result.value.notified).toBe(true)
    }
    expect(mail.items).toHaveLength(1)
    expect(mail.items[0].to).toBe('maria@email.com')
    expect(mail.items[0].text).toContain('Busco dev para API')
    expect(mail.items[0].text).toContain('foi aprovada')
  })

  it('should be able to reject an application and notify the applicant', async () => {
    const { call, application } = seed()

    const result = await sut.execute({
      callId: call.id.toString(),
      applicationId: application.id.toString(),
      authorId: call.authorId.toString(),
      decision: CallApplicationStatus.REJECTED,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.application.status).toBe(CallApplicationStatus.REJECTED)
    }
    expect(mail.items).toHaveLength(1)
    expect(mail.items[0].text).toContain('não foi aprovada')
  })

  it('should register an audit log when an application is decided', async () => {
    const { call, application } = seed()

    await sut.execute({
      callId: call.id.toString(),
      applicationId: application.id.toString(),
      authorId: call.authorId.toString(),
      decision: CallApplicationStatus.APPROVED,
    })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.UPDATE)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('should be able to decide an application after the call was closed', async () => {
    const { call, application } = seed()
    call.close()

    const result = await sut.execute({
      callId: call.id.toString(),
      applicationId: application.id.toString(),
      authorId: call.authorId.toString(),
      decision: CallApplicationStatus.APPROVED,
    })

    expect(result.isRight()).toBeTruthy()
  })

  it('should keep the decision and report it when the email fails to be sent', async () => {
    const { call, application } = seed()
    const failingMail: Mail = {
      async send() {
        throw new Error('falha no provedor de e-mail')
      },
    }
    sut = new DecideCallApplicationUseCase(
      callsRepository,
      callApplicationsRepository,
      usersRepository,
      failingMail,
      registerLog,
    )

    const result = await sut.execute({
      callId: call.id.toString(),
      applicationId: application.id.toString(),
      authorId: call.authorId.toString(),
      decision: CallApplicationStatus.APPROVED,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.notified).toBe(false)
    }
    expect(callApplicationsRepository.items[0].status).toBe(CallApplicationStatus.APPROVED)
    expect(auditLogsRepository.items.map((log) => log.status)).toEqual([AuditLogStatus.SUCCESS, AuditLogStatus.FAILURE])
  })

  it('should not send an email to a deleted applicant', async () => {
    const { call, application, user } = seed()
    user.status = UserStatus.DELETED

    const result = await sut.execute({
      callId: call.id.toString(),
      applicationId: application.id.toString(),
      authorId: call.authorId.toString(),
      decision: CallApplicationStatus.APPROVED,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.notified).toBe(false)
    }
    expect(mail.items).toHaveLength(0)
  })

  it('should not be able to decide as non-owner', async () => {
    const { call, application } = seed()

    const result = await sut.execute({
      callId: call.id.toString(),
      applicationId: application.id.toString(),
      authorId: new UniqueEntityId().toString(),
      decision: CallApplicationStatus.APPROVED,
    })

    expect(result.isLeft()).toBeTruthy()
    expect(callApplicationsRepository.items[0].status).toBe(CallApplicationStatus.PENDING)
    expect(mail.items).toHaveLength(0)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotCallOwnerError)
    }
  })

  it('should not be able to decide an application of a call that does not exist', async () => {
    const result = await sut.execute({
      callId: 'non-existent',
      applicationId: 'any',
      authorId: new UniqueEntityId().toString(),
      decision: CallApplicationStatus.APPROVED,
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CallNotFoundError)
    }
  })

  it('should not be able to decide an application that does not exist', async () => {
    const { call } = seed()

    const result = await sut.execute({
      callId: call.id.toString(),
      applicationId: 'non-existent',
      authorId: call.authorId.toString(),
      decision: CallApplicationStatus.APPROVED,
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CallApplicationNotFoundError)
    }
  })

  it('should not be able to decide an application that belongs to another call', async () => {
    const { call } = seed()
    const { call: otherCall } = makeCall({ authorId: call.authorId })
    const { application: otherApplication } = makeCallApplication({ callId: otherCall.id })
    callsRepository.items.push(otherCall)
    callApplicationsRepository.items.push(otherApplication)

    const result = await sut.execute({
      callId: call.id.toString(),
      applicationId: otherApplication.id.toString(),
      authorId: call.authorId.toString(),
      decision: CallApplicationStatus.APPROVED,
    })

    expect(result.isLeft()).toBeTruthy()
    expect(otherApplication.status).toBe(CallApplicationStatus.PENDING)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CallApplicationNotFoundError)
    }
  })

  it('should not be able to decide an application twice', async () => {
    const { call, application } = seed()
    const request = {
      callId: call.id.toString(),
      applicationId: application.id.toString(),
      authorId: call.authorId.toString(),
    }

    await sut.execute({ ...request, decision: CallApplicationStatus.APPROVED })
    const result = await sut.execute({ ...request, decision: CallApplicationStatus.REJECTED })

    expect(result.isLeft()).toBeTruthy()
    expect(callApplicationsRepository.items[0].status).toBe(CallApplicationStatus.APPROVED)
    expect(mail.items).toHaveLength(1)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCallApplicationStatusError)
    }
  })
})
