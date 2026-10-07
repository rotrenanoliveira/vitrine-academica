import { makeAuditLog } from '@tests/factories/make-audit-log'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { FetchLogsByActorIdUseCase } from './fetch-logs-by-actor-id'

let auditLogsRepository: InMemoryAuditLogsRepository
let sut: FetchLogsByActorIdUseCase

describe('(UC) - Fetch Logs By Actor Id', () => {
  beforeEach(() => {
    auditLogsRepository = new InMemoryAuditLogsRepository()
    sut = new FetchLogsByActorIdUseCase(auditLogsRepository)
  })

  it('should be able to fetch audit logs by actor id', async () => {
    const actorId = new UniqueEntityId()
    const { auditLog: firstLog } = makeAuditLog({ actorId })
    const { auditLog: secondLog } = makeAuditLog({ actorId })
    const { auditLog: otherActorLog } = makeAuditLog({ actorId: new UniqueEntityId() })
    auditLogsRepository.items.push(firstLog, secondLog, otherActorLog)

    const result = await sut.execute({
      actorId: actorId.toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.logs).toHaveLength(2)
      expect(result.value.logs.map((log) => log.id.toString())).toEqual(
        expect.arrayContaining([firstLog.id.toString(), secondLog.id.toString()]),
      )
    }
  })

  it('should be able to fetch an empty list when the actor has no logs', async () => {
    const result = await sut.execute({
      actorId: new UniqueEntityId().toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.logs).toHaveLength(0)
    }
  })
})
