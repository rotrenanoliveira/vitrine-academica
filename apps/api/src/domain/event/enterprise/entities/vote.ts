import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export interface VoteProps {
  eventId: UniqueEntityId
  themeId: UniqueEntityId
  userId: UniqueEntityId
  createdAt: Date
}

export class Vote extends Entity<VoteProps> {
  get eventId() {
    return this.props.eventId
  }

  get themeId() {
    return this.props.themeId
  }

  get userId() {
    return this.props.userId
  }

  get createdAt() {
    return this.props.createdAt
  }

  static create(props: Optional<VoteProps, 'createdAt'>, id?: UniqueEntityId) {
    return new Vote(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
