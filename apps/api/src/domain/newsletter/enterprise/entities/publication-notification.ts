import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface PublicationNotificationProps {
  subscriptionId: UniqueEntityId
  projectId: UniqueEntityId
  status: NotificationStatus
  sentAt?: Date | null
  providerMessageId?: string | null
  createdAt: Date
}

export class PublicationNotification extends Entity<PublicationNotificationProps> {
  get subscriptionId() {
    return this.props.subscriptionId
  }

  get projectId() {
    return this.props.projectId
  }

  get status() {
    return this.props.status
  }

  get sentAt() {
    return this.props.sentAt
  }

  get providerMessageId() {
    return this.props.providerMessageId
  }

  get createdAt() {
    return this.props.createdAt
  }

  markAsSent(providerMessageId: string | null = null) {
    this.props.status = NotificationStatus.SENT
    this.props.sentAt = new Date()
    this.props.providerMessageId = providerMessageId
  }

  markAsFailed() {
    this.props.status = NotificationStatus.FAILED
  }

  static create(props: Optional<PublicationNotificationProps, 'status' | 'createdAt'>, id?: UniqueEntityId) {
    return new PublicationNotification(
      {
        ...props,
        status: props.status ?? NotificationStatus.PENDING,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
