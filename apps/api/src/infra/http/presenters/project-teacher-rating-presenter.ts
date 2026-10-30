import type { ProjectTeacherRating } from '@/domain/project/enterprise/entities/project-teacher-rating'

export class ProjectTeacherRatingPresenter {
  static toHTTP(teacherRating: ProjectTeacherRating) {
    return {
      id: teacherRating.id.toString(),
      projectId: teacherRating.projectId.toString(),
      teacherId: teacherRating.teacherId.toString(),
      overallScore: teacherRating.overallScore,
      ratedAt: teacherRating.ratedAt.toISOString(),
      createdAt: teacherRating.createdAt.toISOString(),
      items: teacherRating.items.map((item) => ({
        id: item.id.toString(),
        criterionId: item.criterionId.toString(),
        score: item.score,
      })),
    }
  }
}
