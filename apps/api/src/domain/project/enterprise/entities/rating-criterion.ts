import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export interface RatingCriterionProps {
  name: string
  description?: string | null
  weight: number
  active: boolean
  validFrom: Date
  validUntil?: Date | null
  createdAt: Date
  updatedAt?: Date | null
}

export class RatingCriterion extends Entity<RatingCriterionProps> {
  get name() {
    return this.props.name
  }

  get description() {
    return this.props.description
  }

  get weight() {
    return this.props.weight
  }

  get active() {
    return this.props.active
  }

  get validFrom() {
    return this.props.validFrom
  }

  get validUntil() {
    return this.props.validUntil
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  isValidAt(at: Date = new Date()) {
    if (!this.props.active) {
      return false
    }

    if (this.props.validFrom > at) {
      return false
    }

    if (this.props.validUntil && this.props.validUntil < at) {
      return false
    }

    return true
  }

  static create(
    props: Optional<
      RatingCriterionProps,
      'createdAt' | 'active' | 'weight' | 'validFrom' | 'description' | 'validUntil' | 'updatedAt'
    >,
    id?: UniqueEntityId,
  ) {
    return new RatingCriterion(
      {
        ...props,
        description: props.description ?? null,
        weight: props.weight ?? 1,
        active: props.active ?? true,
        validFrom: props.validFrom ?? new Date(),
        validUntil: props.validUntil ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id,
    )
  }
}
