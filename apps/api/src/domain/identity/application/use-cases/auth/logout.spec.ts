import { makeSession } from '@tests/factories/make-session'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemorySessionsRepository } from '@tests/repositories/in-memory-sessions-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { SessionAlreadyRevokedError } from '../../_errors/session-already-revoked-error'
import { SessionNotFoundError } from '../../_errors/session-not-found-error'
import { LogoutUseCase } from './logout'

let sessionsRepository: InMemorySessionsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: LogoutUseCase

describe('(UC) - Logout', () => {
  beforeEach(() => {
    sessionsRepository = new InMemorySessionsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()
    const registerLog = new RegisterLogUseCase(auditLogsRepository)
    sut = new LogoutUseCase(sessionsRepository, registerLog)
  })

  it('should be able to logout by revoking the session', async () => {
    const { session } = makeSession()
    sessionsRepository.items.push(session)

    const result = await sut.execute({ sessionId: session.id.toString() })

    expect(result.isRight()).toBeTruthy()
    expect(session.isRevoked()).toBeTruthy()
    expect(session.revokedAt).toBeInstanceOf(Date)

    if (result.isRight()) {
      expect(result.value.session.id.toString()).toBe(session.id.toString())
    }
  })

  it('should register an audit log when logout succeeds', async () => {
    const { session } = makeSession()
    sessionsRepository.items.push(session)

    await sut.execute({ sessionId: session.id.toString() })

    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.LOGOUT)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
  })

  it('should not be able to logout when session does not exist', async () => {
    const result = await sut.execute({ sessionId: new UniqueEntityId().toString() })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(0)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(SessionNotFoundError)
    }
  })

  it('should not be able to logout when session is already revoked', async () => {
    const { session } = makeSession({ revokedAt: new Date() })
    sessionsRepository.items.push(session)

    const result = await sut.execute({ sessionId: session.id.toString() })

    expect(result.isLeft()).toBeTruthy()
    expect(auditLogsRepository.items).toHaveLength(1)
    expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.FAILURE)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(SessionAlreadyRevokedError)
    }
  })
})
