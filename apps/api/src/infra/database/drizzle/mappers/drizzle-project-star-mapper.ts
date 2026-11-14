import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStar } from '@/domain/project/enterprise/entities/project-star'
import type { projectStars } from '../schemas/project-stars'

type DrizzleProjectStar = typeof projectStars.$inferSelect
type DrizzleProjectStarInsert = typeof projectStars.$inferInsert

export class DrizzleProjectStarMapper {
  static toDomain(row: DrizzleProjectStar): ProjectStar {
    return ProjectStar.create(
      {
        projectId: new UniqueEntityId(row.projectId),
        userId: new UniqueEntityId(row.userId),
        weight: row.weight,
        active: row.active,
        ratedAt: row.ratedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(entity: ProjectStar): DrizzleProjectStarInsert {
    return {
      id: entity.id.toString(),
      projectId: entity.projectId.toString(),
      userId: entity.userId.toString(),
      weight: entity.weight,
      active: entity.active,
      ratedAt: entity.ratedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt ?? undefined,
    }
  }
}
