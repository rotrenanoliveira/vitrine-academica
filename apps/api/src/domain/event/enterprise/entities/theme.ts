import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export enum ThemeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  HIDDEN = 'HIDDEN',
}

export interface ThemeProps {
  eventId: UniqueEntityId
  authorId: UniqueEntityId
  title: string
  description: string
  status: ThemeStatus
  moderatedByUserId: UniqueEntityId | null
  moderatedAt: Date | null
  moderationReason: string | null
  createdAt: Date
  updatedAt?: Date | null
}

export class Theme extends Entity<ThemeProps> {
  get eventId() {
    return this.props.eventId
  }

  get authorId() {
    return this.props.authorId
  }

  get title() {
    return this.props.title
  }

  get description() {
    return this.props.description
  }

  get status() {
    return this.props.status
  }

  get moderatedByUserId() {
    return this.props.moderatedByUserId
  }

  get moderatedAt() {
    return this.props.moderatedAt
  }

  get moderationReason() {
    return this.props.moderationReason
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  isApproved() {
    return this.props.status === ThemeStatus.APPROVED
  }

  approve(moderatorId: UniqueEntityId, reason?: string | null, moderatedAt = new Date()) {
    this.applyModeration(ThemeStatus.APPROVED, moderatorId, reason ?? null, moderatedAt)
  }

  reject(moderatorId: UniqueEntityId, reason: string, moderatedAt = new Date()) {
    this.applyModeration(ThemeStatus.REJECTED, moderatorId, reason, moderatedAt)
  }

  hide(moderatorId: UniqueEntityId, reason?: string | null, moderatedAt = new Date()) {
    this.applyModeration(ThemeStatus.HIDDEN, moderatorId, reason ?? null, moderatedAt)
  }

  private applyModeration(status: ThemeStatus, moderatorId: UniqueEntityId, reason: string | null, moderatedAt: Date) {
    this.props.status = status
    this.props.moderatedByUserId = moderatorId
    this.props.moderatedAt = moderatedAt
    this.props.moderationReason = reason
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Optional<ThemeProps, 'createdAt' | 'status' | 'moderatedByUserId' | 'moderatedAt' | 'moderationReason'>,
    id?: UniqueEntityId,
  ) {
    return new Theme(
      {
        ...props,
        status: props.status ?? ThemeStatus.PENDING,
        moderatedByUserId: props.moderatedByUserId ?? null,
        moderatedAt: props.moderatedAt ?? null,
        moderationReason: props.moderationReason ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
