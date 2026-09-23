import { type Either, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { AuditLog, type AuditLogAction, type AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { AuditLogsRepository } from '../../repositories/audit-logs-repository'

interface RegisterLogUseCaseRequest {
  actorId: string
  sessionId?: string | null
  action: AuditLogAction
  resource: string
  resourceId: string
  diff: Record<string, { old: unknown; new: unknown }> | null
  text?: string | null
  status: AuditLogStatus
}

type RegisterLogUseCaseResponse = Either<unknown, { audit: string }>

export class RegisterLogUseCase {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async execute({
    actorId,
    sessionId,
    action,
    resource,
    resourceId,
    diff,
    text,
    status,
  }: RegisterLogUseCaseRequest): Promise<RegisterLogUseCaseResponse> {
    const auditLog = AuditLog.create({
      actorId: new UniqueEntityId(actorId),
      sessionId: sessionId ? new UniqueEntityId(sessionId) : null,
      resourceId: new UniqueEntityId(resourceId),
      action,
      resource,
      diff,
      text,
      status,
    })

    await this.auditLogsRepository.create(auditLog)

    return right({ audit: auditLog.id.toString() })
  }
}
