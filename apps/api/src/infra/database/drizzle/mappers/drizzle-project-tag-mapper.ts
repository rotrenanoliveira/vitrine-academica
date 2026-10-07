import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectTag } from '@/domain/project/enterprise/entities/project-tag'
import type { projectTags } from '../schemas/project-tags'

type DrizzleProjectTag = typeof projectTags.$inferSelect
type DrizzleProjectTagInsert = typeof projectTags.$inferInsert

export class DrizzleProjectTagMapper {
  static toDomain(row: DrizzleProjectTag): ProjectTag {
    return ProjectTag.create(
      {
        projectId: new UniqueEntityId(row.projectId),
        tagId: new UniqueEntityId(row.tagId),
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(projectTag: ProjectTag): DrizzleProjectTagInsert {
    return {
      id: projectTag.id.toString(),
      projectId: projectTag.projectId.toString(),
      tagId: projectTag.tagId.toString(),
    }
  }
}
