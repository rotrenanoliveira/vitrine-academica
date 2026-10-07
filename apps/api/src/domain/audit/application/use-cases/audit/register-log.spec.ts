import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { RegisterLogUseCase } from './register-log'

let auditLogsRepository: InMemoryAuditLogsRepository
let sut: RegisterLogUseCase

describe('(UC) - Register Log', () => {
  beforeEach(() => {
    auditLogsRepository = new InMemoryAuditLogsRepository()
    sut = new RegisterLogUseCase(auditLogsRepository)
  })

  it('should be able to register a new audit log', async () => {
    const actorId = new UniqueEntityId().toString()
    const sessionId = new UniqueEntityId().toString()
    const resourceId = new UniqueEntityId().toString()

    const result = await sut.execute({
      actorId,
      sessionId,
      action: AuditLogAction.CREATE,
      resource: 'project',
      resourceId,
      diff: { title: { old: null, new: 'Novo projeto' } },
      status: AuditLogStatus.SUCCESS,
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.audit).toEqual(expect.any(String))
      expect(auditLogsRepository.items).toHaveLength(1)
      expect(auditLogsRepository.items[0].actorId.toString()).toBe(actorId)
      expect(auditLogsRepository.items[0].sessionId?.toString()).toBe(sessionId)
      expect(auditLogsRepository.items[0].action).toBe(AuditLogAction.CREATE)
      expect(auditLogsRepository.items[0].resource).toBe('project')
      expect(auditLogsRepository.items[0].resourceId.toString()).toBe(resourceId)
      expect(auditLogsRepository.items[0].status).toBe(AuditLogStatus.SUCCESS)
    }
  })
})
