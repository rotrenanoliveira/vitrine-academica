import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export interface SessionProps {
  accountId: UniqueEntityId
  userId: UniqueEntityId
  expiresAt: Date
  revokedAt: Date | null
  createdAt: Date
  updatedAt?: Date | null
}

export class Session extends Entity<SessionProps> {
  get accountId(): UniqueEntityId {
    return this.props.accountId
  }

  get userId(): UniqueEntityId {
    return this.props.userId
  }

  get expiresAt(): Date {
    return this.props.expiresAt
  }

  get revokedAt(): Date | null {
    return this.props.revokedAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date | null | undefined {
    return this.props.updatedAt
  }

  isRevoked(): boolean {
    return this.props.revokedAt != null
  }

  isExpired(now = new Date()): boolean {
    return now >= this.props.expiresAt
  }

  isActive(now = new Date()): boolean {
    return !this.isRevoked() && !this.isExpired(now)
  }

  revoke(now = new Date()): void {
    this.props.revokedAt = now
    this.touch()
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  static create(props: Optional<SessionProps, 'createdAt' | 'revokedAt'>, id?: UniqueEntityId) {
    return new Session(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        revokedAt: props.revokedAt ?? null,
      },
      id,
    )
  }
}
