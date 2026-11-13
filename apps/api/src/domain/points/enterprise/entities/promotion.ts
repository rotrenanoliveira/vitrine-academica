import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export enum PromotionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
}

export interface PromotionProps {
  projectId: UniqueEntityId
  promoterId: UniqueEntityId
  cost: number
  status: PromotionStatus
  expiresAt: Date
  createdAt: Date
  updatedAt?: Date | null
}

export class Promotion extends Entity<PromotionProps> {
  get projectId() {
    return this.props.projectId
  }

  get promoterId() {
    return this.props.promoterId
  }

  get cost() {
    return this.props.cost
  }

  get status() {
    return this.props.status
  }

  get expiresAt() {
    return this.props.expiresAt
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  isActive(now: Date) {
    return this.props.status === PromotionStatus.ACTIVE && this.props.expiresAt.getTime() > now.getTime()
  }

  expire() {
    if (this.props.status === PromotionStatus.EXPIRED) {
      return
    }

    this.props.status = PromotionStatus.EXPIRED
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
  static create(props: Optional<PromotionProps, 'createdAt' | 'status'>, id?: UniqueEntityId) {
    return new Promotion(
      {
        ...props,
        status: props.status ?? PromotionStatus.ACTIVE,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
