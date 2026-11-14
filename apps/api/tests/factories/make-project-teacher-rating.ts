import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  ProjectTeacherRating,
  type ProjectTeacherRatingProps,
} from '@/domain/project/enterprise/entities/project-teacher-rating'
import { TeacherRatingItem } from '@/domain/project/enterprise/entities/teacher-rating-item'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectTeacherRatingsRepository } from '@/infra/database/repositories/drizzle-project-teacher-ratings-repository'

export function makeProjectTeacherRating(override: Partial<ProjectTeacherRatingProps> = {}, id?: UniqueEntityId) {
  const ratingId = id ?? new UniqueEntityId()
  const items = override.items ?? [
    TeacherRatingItem.create({
      ratingId,
      criterionId: new UniqueEntityId(),
      score: 8,
    }),
  ]

  const teacherRating = ProjectTeacherRating.create(
    {
      projectId: new UniqueEntityId(),
      teacherId: new UniqueEntityId(),
      overallScore: 8,
      items,
      ...override,
    },
    ratingId,
  )

  return { teacherRating }
}

export async function makeProjectTeacherRatingOnDatabase(
  override: Partial<ProjectTeacherRatingProps> = {},
  id?: UniqueEntityId,
) {
  const { teacherRating } = makeProjectTeacherRating(override, id)
  const repository = new DrizzleProjectTeacherRatingsRepository(db)
  await repository.create(teacherRating)
  return { teacherRating }
}
