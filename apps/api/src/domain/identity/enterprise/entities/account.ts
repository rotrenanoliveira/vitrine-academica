import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export interface AccountProps {
  userId: UniqueEntityId
  avatarId: UniqueEntityId | null
  createdAt: Date
  confirmationAt?: Date | null
  consentedAt?: Date | null
  updatedAt?: Date | null
}

export class Account extends Entity<AccountProps> {
  get userId(): UniqueEntityId {
    return this.props.userId
  }

  get avatarId(): UniqueEntityId | null {
    return this.props.avatarId
  }

  set avatarId(avatarId: UniqueEntityId) {
    this.props.avatarId = avatarId
    this.touch()
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get confirmationAt(): Date | null | undefined {
    return this.props.confirmationAt
  }

  set confirmationAt(confirmationAt: Date | null) {
    this.props.confirmationAt = confirmationAt
    this.touch()
  }

  get consentedAt(): Date | null | undefined {
    return this.props.consentedAt
  }

  set consentedAt(consentedAt: Date | null) {
    this.props.consentedAt = consentedAt
    this.touch()
  }

  get updatedAt(): Date | null | undefined {
    return this.props.updatedAt
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(props: Optional<AccountProps, 'createdAt'>, id?: UniqueEntityId) {
    return new Account(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
