import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  AuditLog,
  AuditLogAction,
  type AuditLogProps,
  AuditLogStatus,
} from '@/domain/audit/enterprise/entities/audit-log'

export function makeAuditLog(override: Partial<AuditLogProps> = {}, id?: UniqueEntityId) {
  const auditLog = AuditLog.create(
    {
      actorId: new UniqueEntityId(),
      sessionId: new UniqueEntityId(),
      action: AuditLogAction.CREATE,
      resource: 'project',
      resourceId: new UniqueEntityId(),
      diff: {},
      status: AuditLogStatus.SUCCESS,
      ...override,
    },
    id,
  )

  return { auditLog }
}
