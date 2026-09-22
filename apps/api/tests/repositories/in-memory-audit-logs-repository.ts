import type { AuditLogsRepository } from '@/domain/audit/application/repositories/audit-logs-repository'
import type { AuditLog } from '@/domain/audit/enterprise/entities/audit-log'

export class InMemoryAuditLogsRepository implements AuditLogsRepository {
  public items: AuditLog[] = []

  async findAll(): Promise<AuditLog[]> {
    return this.items
  }

  async findManyByActorId(actorId: string): Promise<AuditLog[]> {
    return this.items.filter((auditLog) => auditLog.actorId.toString() === actorId)
  }

  async findManyByResource(resource: string): Promise<AuditLog[]> {
    return this.items.filter((auditLog) => auditLog.resource === resource)
  }

  async findManyBySessionId(sessionId: string): Promise<AuditLog[]> {
    return this.items.filter((auditLog) => auditLog.sessionId?.toString() === sessionId)
  }

  async create(auditLog: AuditLog): Promise<void> {
    this.items.push(auditLog)
  }
}
