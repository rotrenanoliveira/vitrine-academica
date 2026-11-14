import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export interface ProjectStarProps {
  projectId: UniqueEntityId
  userId: UniqueEntityId
  weight: number
  active: boolean
  ratedAt: Date
  createdAt: Date
  updatedAt?: Date | null
}

export class ProjectStar extends Entity<ProjectStarProps> {
  get projectId() {
    return this.props.projectId
  }

  get userId() {
    return this.props.userId
  }

  get weight() {
    return this.props.weight
  }

  set weight(weight: number) {
    this.props.weight = weight
    this.touch()
  }

  get active() {
    return this.props.active
  }

  get ratedAt() {
    return this.props.ratedAt
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  deactivate() {
    this.props.active = false
    this.touch()
  }

  reactivate(weight: number) {
    this.props.active = true
    this.props.weight = weight
    this.props.ratedAt = new Date()
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(props: Optional<ProjectStarProps, 'createdAt' | 'active' | 'ratedAt' | 'weight'>, id?: UniqueEntityId) {
    return new ProjectStar(
      {
        ...props,
        weight: props.weight ?? 1,
        active: props.active ?? true,
        ratedAt: props.ratedAt ?? new Date(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
