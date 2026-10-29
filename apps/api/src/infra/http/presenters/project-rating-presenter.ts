import type { ProjectRating } from '@/domain/project/enterprise/entities/project-rating'

export class ProjectRatingPresenter {
  static toHTTP(rating: ProjectRating) {
    return {
      projectId: rating.projectId.toString(),
      starsCount: rating.starsCount,
      starsWeightedScore: rating.starsWeightedScore,
      teacherEvaluationsCount: rating.teacherEvaluationsCount,
      teacherAverage: rating.teacherAverage,
      teacherScoresByCriterion: rating.teacherScoresByCriterion,
    }
  }
}
