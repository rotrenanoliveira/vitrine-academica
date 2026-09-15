import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectScheduled } from '@/domain/project/enterprise/entities/project-scheduled'
import type { projectScheduled } from '../schemas/project-scheduled'

type DrizzleProjectScheduled = typeof projectScheduled.$inferSelect
type DrizzleProjectScheduledInsert = typeof projectScheduled.$inferInsert

export class DrizzleProjectScheduledMapper {
  static toDomain(row: DrizzleProjectScheduled): ProjectScheduled {
    return ProjectScheduled.create(
      {
        projectId: new UniqueEntityId(row.projectId),
        publishedIn: row.publishedIn,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(entity: ProjectScheduled): DrizzleProjectScheduledInsert {
    return {
      id: entity.id.toString(),
      projectId: entity.projectId.toString(),
      publishedIn: entity.publishedIn,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt ?? undefined,
    }
  }
}
