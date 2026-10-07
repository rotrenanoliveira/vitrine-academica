import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export enum PreferenceTagStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface PreferenceTagProps {
  tagId: UniqueEntityId
  userId: UniqueEntityId
  status: PreferenceTagStatus
  createdAt: Date
  updatedAt?: Date | null
}

export class PreferenceTag extends Entity<PreferenceTagProps> {
  get tagId() {
    return this.props.tagId
  }

  get userId() {
    return this.props.userId
  }

  get status() {
    return this.props.status
  }

  set status(status: PreferenceTagStatus) {
    this.props.status = status
    this.touch()
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(props: Optional<PreferenceTagProps, 'createdAt' | 'status'>, id?: UniqueEntityId) {
    return new PreferenceTag(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        status: props.status ?? PreferenceTagStatus.ACTIVE,
      },
      id,
    )
  }
}
