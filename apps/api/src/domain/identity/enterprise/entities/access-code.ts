import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export interface AccessCodeProps {
  accountId: UniqueEntityId
  codeHash: string
  expiresAt: Date
  consumedAt: Date | null
  createdAt: Date
  updatedAt?: Date | null
}

export class AccessCode extends Entity<AccessCodeProps> {
  get accountId(): UniqueEntityId {
    return this.props.accountId
  }

  get codeHash(): string {
    return this.props.codeHash
  }

  get expiresAt(): Date {
    return this.props.expiresAt
  }

  get consumedAt(): Date | null {
    return this.props.consumedAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date | null | undefined {
    return this.props.updatedAt
  }

  isExpired(now = new Date()): boolean {
    return now >= this.props.expiresAt
  }

  isConsumed(): boolean {
    return this.props.consumedAt != null
  }

  consume(now = new Date()): void {
    this.props.consumedAt = now
    this.touch()
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Optional<AccessCodeProps, 'createdAt' | 'consumedAt'>,
    id?: UniqueEntityId,
  ) {
    return new AccessCode(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        consumedAt: props.consumedAt ?? null,
      },
      id,
    )
  }
}
