import { makeAuditLog } from '@tests/factories/make-audit-log'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { FetchLogsBySessionIdUseCase } from './fetch-logs-by-session-id'

let auditLogsRepository: InMemoryAuditLogsRepository
let sut: FetchLogsBySessionIdUseCase

describe('(UC) - Fetch Logs By Session Id', () => {
  beforeEach(() => {
    auditLogsRepository = new InMemoryAuditLogsRepository()
    sut = new FetchLogsBySessionIdUseCase(auditLogsRepository)
  })

  it('should be able to fetch audit logs by session id', async () => {
    const sessionId = new UniqueEntityId()
    const { auditLog: firstLog } = makeAuditLog({ sessionId })
    const { auditLog: secondLog } = makeAuditLog({ sessionId })
    const { auditLog: otherSessionLog } = makeAuditLog({ sessionId: new UniqueEntityId() })
    auditLogsRepository.items.push(firstLog, secondLog, otherSessionLog)

    const result = await sut.execute({
      sessionId: sessionId.toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.logs).toHaveLength(2)
      expect(result.value.logs.map((log) => log.id.toString())).toEqual(
        expect.arrayContaining([firstLog.id.toString(), secondLog.id.toString()]),
      )
    }
  })

  it('should be able to fetch an empty list when the session has no logs', async () => {
    const result = await sut.execute({
      sessionId: new UniqueEntityId().toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.logs).toHaveLength(0)
    }
  })
})
