import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export enum AuditLogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
}

export enum AuditLogStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

export interface AuditLogProps {
  timestamp: Date
  actorId: UniqueEntityId
  sessionId: UniqueEntityId | null
  action: AuditLogAction
  resource: string // domínio
  resourceId: UniqueEntityId
  diff: Record<string, { old: unknown; new: unknown }> | null
  text: string | null
  status: AuditLogStatus
}

export class AuditLog extends Entity<AuditLogProps> {
  get actorId() {
    return this.props.actorId
  }

  get sessionId() {
    return this.props.sessionId
  }

  get timestamp() {
    return this.props.timestamp
  }

  get action() {
    return this.props.action
  }

  get resource() {
    return this.props.resource
  }

  get resourceId() {
    return this.props.resourceId
  }

  get diff() {
    return this.props.diff
  }

  get text() {
    return this.props.text
  }

  get status() {
    return this.props.status
  }

  static create(props: Optional<AuditLogProps, 'timestamp' | 'text'>, id?: UniqueEntityId) {
    return new AuditLog(
      {
        ...props,
        timestamp: props.timestamp ?? new Date(),
        text: props.text ?? null,
      },
      id,
    )
  }
}
