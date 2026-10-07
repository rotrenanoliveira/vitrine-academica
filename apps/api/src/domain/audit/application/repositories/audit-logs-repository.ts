import type { AuditLog } from '../../enterprise/entities/audit-log'

export interface AuditLogsRepository {
  findAll(): Promise<AuditLog[]>
  findManyByActorId(actorId: string): Promise<AuditLog[]>
  findManyByResource(resource: string): Promise<AuditLog[]>
  findManyBySessionId(sessionId: string): Promise<AuditLog[]>

  create(auditLog: AuditLog): Promise<void>
}
