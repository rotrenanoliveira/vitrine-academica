import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectTeacherRating } from '@/domain/project/enterprise/entities/project-teacher-rating'
import { TeacherRatingItem } from '@/domain/project/enterprise/entities/teacher-rating-item'
import type { projectTeacherRatings } from '../schemas/project-teacher-ratings'
import type { teacherRatingItems } from '../schemas/teacher-rating-items'

type DrizzleProjectTeacherRating = typeof projectTeacherRatings.$inferSelect
type DrizzleProjectTeacherRatingInsert = typeof projectTeacherRatings.$inferInsert
type DrizzleTeacherRatingItem = typeof teacherRatingItems.$inferSelect
type DrizzleTeacherRatingItemInsert = typeof teacherRatingItems.$inferInsert

export class DrizzleProjectTeacherRatingMapper {
  static toDomain(row: DrizzleProjectTeacherRating, itemRows: DrizzleTeacherRatingItem[] = []): ProjectTeacherRating {
    const ratingId = new UniqueEntityId(row.id)

    return ProjectTeacherRating.create(
      {
        projectId: new UniqueEntityId(row.projectId),
        teacherId: new UniqueEntityId(row.teacherId),
        overallScore: row.overallScore,
        ratedAt: row.ratedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        items: itemRows.map((item) =>
          TeacherRatingItem.create(
            {
              ratingId,
              criterionId: new UniqueEntityId(item.criterionId),
              score: item.score,
            },
            new UniqueEntityId(item.id),
          ),
        ),
      },
      ratingId,
    )
  }

  static toPersistence(entity: ProjectTeacherRating): DrizzleProjectTeacherRatingInsert {
    return {
      id: entity.id.toString(),
      projectId: entity.projectId.toString(),
      teacherId: entity.teacherId.toString(),
      overallScore: entity.overallScore,
      ratedAt: entity.ratedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt ?? undefined,
    }
  }

  static itemsToPersistence(entity: ProjectTeacherRating): DrizzleTeacherRatingItemInsert[] {
    return entity.items.map((item) => ({
      id: item.id.toString(),
      ratingId: entity.id.toString(),
      criterionId: item.criterionId.toString(),
      score: item.score,
    }))
  }
}
