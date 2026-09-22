import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  AuditLog,
  type AuditLogAction,
  type AuditLogStatus,
} from '@/domain/audit/enterprise/entities/audit-log'
import type { auditLogs } from '../schemas/audit-log'

type DrizzleAuditLog = typeof auditLogs.$inferSelect
type DrizzleAuditLogInsert = typeof auditLogs.$inferInsert

export class DrizzleAuditLogMapper {
  static toDomain(row: DrizzleAuditLog): AuditLog {
    return AuditLog.create(
      {
        timestamp: row.timestamp,
        actorId: new UniqueEntityId(row.actorId),
        sessionId: row.sessionId ? new UniqueEntityId(row.sessionId) : null,
        action: row.action as AuditLogAction,
        resource: row.resource,
        resourceId: new UniqueEntityId(row.resourceId),
        diff: row.diff as Record<string, { old: unknown; new: unknown }>,
        status: row.status as AuditLogStatus,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(auditLog: AuditLog): DrizzleAuditLogInsert {
    return {
      id: auditLog.id.toString(),
      timestamp: auditLog.timestamp,
      actorId: auditLog.actorId.toString(),
      sessionId: auditLog.sessionId?.toString() ?? null,
      action: auditLog.action,
      resource: auditLog.resource,
      resourceId: auditLog.resourceId.toString(),
      diff: auditLog.diff,
      status: auditLog.status,
    }
  }
}
