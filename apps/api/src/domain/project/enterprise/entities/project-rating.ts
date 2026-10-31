import type { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface ProjectRatingCriterionAverage {
  criterionId: string
  criterionName: string
  average: number
}

export interface ProjectRatingProps {
  projectId: UniqueEntityId
  starsCount: number
  starsWeightedScore: number
  teacherRatingsCount: number
  teacherAverage: number | null
  teacherScoresByCriterion: ProjectRatingCriterionAverage[]
}

export class ProjectRating {
  private constructor(private readonly props: ProjectRatingProps) {}

  get projectId() {
    return this.props.projectId
  }

  get starsCount() {
    return this.props.starsCount
  }

  get starsWeightedScore() {
    return this.props.starsWeightedScore
  }

  get teacherRatingsCount() {
    return this.props.teacherRatingsCount
  }

  get teacherAverage() {
    return this.props.teacherAverage
  }

  get teacherScoresByCriterion() {
    return this.props.teacherScoresByCriterion
  }

  static create(props: ProjectRatingProps) {
    return new ProjectRating(props)
  }
}
