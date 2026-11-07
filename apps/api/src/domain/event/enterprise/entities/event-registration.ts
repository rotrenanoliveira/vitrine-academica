import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export enum EventRegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface EventRegistrationProps {
  eventId: UniqueEntityId
  projectId: UniqueEntityId
  responsibleUserId: UniqueEntityId
  status: EventRegistrationStatus
  reviewedByUserId: UniqueEntityId | null
  reviewedAt: Date | null
  reviewReason: string | null
  registeredAt: Date
}

export class EventRegistration extends Entity<EventRegistrationProps> {
  get eventId() {
    return this.props.eventId
  }

  get projectId() {
    return this.props.projectId
  }

  get responsibleUserId() {
    return this.props.responsibleUserId
  }

  get status() {
    return this.props.status
  }

  get reviewedByUserId() {
    return this.props.reviewedByUserId
  }

  get reviewedAt() {
    return this.props.reviewedAt
  }

  get reviewReason() {
    return this.props.reviewReason
  }

  get registeredAt() {
    return this.props.registeredAt
  }

  isPending() {
    return this.props.status === EventRegistrationStatus.PENDING
  }

  isApproved() {
    return this.props.status === EventRegistrationStatus.APPROVED
  }

  approve(reviewerId: UniqueEntityId, reason?: string | null, reviewedAt = new Date()) {
    if (!this.isPending()) {
      throw new Error('InvalidRegistrationStatusError')
    }

    this.props.status = EventRegistrationStatus.APPROVED
    this.props.reviewedByUserId = reviewerId
    this.props.reviewedAt = reviewedAt
    this.props.reviewReason = reason ?? null
  }

  reject(reviewerId: UniqueEntityId, reason: string, reviewedAt = new Date()) {
    if (!this.isPending()) {
      throw new Error('InvalidRegistrationStatusError')
    }

    this.props.status = EventRegistrationStatus.REJECTED
    this.props.reviewedByUserId = reviewerId
    this.props.reviewedAt = reviewedAt
    this.props.reviewReason = reason
  }

  static create(
    props: Optional<
      EventRegistrationProps,
      'status' | 'reviewedByUserId' | 'reviewedAt' | 'reviewReason' | 'registeredAt'
    >,
    id?: UniqueEntityId,
  ) {
    return new EventRegistration(
      {
        ...props,
        status: props.status ?? EventRegistrationStatus.PENDING,
        reviewedByUserId: props.reviewedByUserId ?? null,
        reviewedAt: props.reviewedAt ?? null,
        reviewReason: props.reviewReason ?? null,
        registeredAt: props.registeredAt ?? new Date(),
      },
      id,
    )
  }
}
