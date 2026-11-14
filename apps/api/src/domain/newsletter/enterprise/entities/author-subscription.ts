import { randomBytes } from 'node:crypto'
import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  BOUNCED = 'BOUNCED',
}

export interface AuthorSubscriptionProps {
  subscriberId: UniqueEntityId
  authorId: UniqueEntityId
  email: string
  unsubscribeToken: string
  status: SubscriptionStatus
  subscribedAt: Date
  unsubscribedAt?: Date | null
}

export class AuthorSubscription extends Entity<AuthorSubscriptionProps> {
  get subscriberId() {
    return this.props.subscriberId
  }

  get authorId() {
    return this.props.authorId
  }

  get email() {
    return this.props.email
  }

  get unsubscribeToken() {
    return this.props.unsubscribeToken
  }

  get status() {
    return this.props.status
  }

  get subscribedAt() {
    return this.props.subscribedAt
  }

  get unsubscribedAt() {
    return this.props.unsubscribedAt
  }

  get isActive() {
    return this.props.status === SubscriptionStatus.ACTIVE
  }

  unsubscribe() {
    this.props.status = SubscriptionStatus.UNSUBSCRIBED
    this.props.unsubscribedAt = new Date()
  }

  resubscribe(email: string) {
    this.props.email = email
    this.props.status = SubscriptionStatus.ACTIVE
    this.props.subscribedAt = new Date()
    this.props.unsubscribedAt = null
  }

  static create(
    props: Optional<AuthorSubscriptionProps, 'unsubscribeToken' | 'status' | 'subscribedAt'>,
    id?: UniqueEntityId,
  ) {
    return new AuthorSubscription(
      {
        ...props,
        unsubscribeToken: props.unsubscribeToken ?? randomBytes(32).toString('hex'),
        status: props.status ?? SubscriptionStatus.ACTIVE,
        subscribedAt: props.subscribedAt ?? new Date(),
      },
      id,
    )
  }
}
