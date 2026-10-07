import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export interface ProjectScheduledProps {
  projectId: UniqueEntityId
  publishedIn: Date
  createdAt: Date
  updatedAt?: Date | null
}

export class ProjectScheduled extends Entity<ProjectScheduledProps> {
  get projectId() {
    return this.props.projectId
  }

  get publishedIn() {
    return this.props.publishedIn
  }

  set publishedIn(publishedIn: Date) {
    this.props.publishedIn = publishedIn
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

  static create(props: Optional<ProjectScheduledProps, 'createdAt'>, id?: UniqueEntityId) {
    return new ProjectScheduled(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
