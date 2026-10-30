import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface TeacherRatingItemProps {
  ratingId: UniqueEntityId
  criterionId: UniqueEntityId
  score: number
}

export class TeacherRatingItem extends Entity<TeacherRatingItemProps> {
  get ratingId() {
    return this.props.ratingId
  }

  get criterionId() {
    return this.props.criterionId
  }

  get score() {
    return this.props.score
  }

  set score(score: number) {
    this.props.score = score
  }

  static create(props: TeacherRatingItemProps, id?: UniqueEntityId) {
    return new TeacherRatingItem(props, id)
  }
}
