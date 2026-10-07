import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED',
  DELETED = 'DELETED',
}

export interface UserProps {
  name: string
  email: string
  status: UserStatus
  updatedAt?: Date | null
}

export class User extends Entity<UserProps> {
  get name(): string {
    return this.props.name
  }

  set name(value: string) {
    this.props.name = value
    this.touch()
  }

  get email(): string {
    return this.props.email
  }

  set email(value: string) {
    this.props.email = value
    this.touch()
  }

  get status(): UserStatus {
    return this.props.status
  }

  set status(value: UserStatus) {
    this.props.status = value
    this.touch()
  }

  get updatedAt(): Date | null | undefined {
    return this.props.updatedAt
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  static create(props: Optional<UserProps, 'status'>, id?: UniqueEntityId) {
    return new User(
      {
        ...props,
        email: props.email.toLocaleLowerCase(),
        status: props.status ?? UserStatus.PENDING,
      },
      id,
    )
  }
}
