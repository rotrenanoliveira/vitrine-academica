import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'
import type { TeacherRatingItem } from './teacher-rating-item'

export interface ProjectTeacherRatingProps {
  projectId: UniqueEntityId
  teacherId: UniqueEntityId
  overallScore: number
  ratedAt: Date
  createdAt: Date
  updatedAt?: Date | null
  items: TeacherRatingItem[]
}

export class ProjectTeacherRating extends Entity<ProjectTeacherRatingProps> {
  get projectId() {
    return this.props.projectId
  }

  get teacherId() {
    return this.props.teacherId
  }

  get overallScore() {
    return this.props.overallScore
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

  get items() {
    return this.props.items
  }

  updateScores(items: TeacherRatingItem[], overallScore: number) {
    this.props.items = items
    this.props.overallScore = overallScore
    this.props.ratedAt = new Date()
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Optional<ProjectTeacherRatingProps, 'createdAt' | 'ratedAt' | 'updatedAt' | 'items'>,
    id?: UniqueEntityId,
  ) {
    return new ProjectTeacherRating(
      {
        ...props,
        items: props.items ?? [],
        ratedAt: props.ratedAt ?? new Date(),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id,
    )
  }
}
