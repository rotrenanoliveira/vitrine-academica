import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export enum PointTransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum PointTransactionReason {
  STAR_RECEIVED = 'STAR_RECEIVED',
  PROMOTION = 'PROMOTION',
}

export interface PointTransactionProps {
  userId: UniqueEntityId
  type: PointTransactionType
  amount: number
  reason: PointTransactionReason
  referenceId: UniqueEntityId
  createdAt: Date
}

export class PointTransaction extends Entity<PointTransactionProps> {
  get userId() {
    return this.props.userId
  }

  get type() {
    return this.props.type
  }

  get amount() {
    return this.props.amount
  }

  get reason() {
    return this.props.reason
  }

  get referenceId() {
    return this.props.referenceId
  }

  get createdAt() {
    return this.props.createdAt
  }

  static create(props: Optional<PointTransactionProps, 'createdAt'>, id?: UniqueEntityId) {
    return new PointTransaction(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
