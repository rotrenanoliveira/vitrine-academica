import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectMember, type ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import type { projectMembers } from '../schemas'

type DrizzleProjectMember = typeof projectMembers.$inferSelect
type DrizzleProjectMemberInsert = typeof projectMembers.$inferInsert

export class DrizzleProjectMemberMapper {
  static toDomain(row: DrizzleProjectMember): ProjectMember {
    return ProjectMember.create(
      {
        projectId: new UniqueEntityId(row.projectId),
        userId: new UniqueEntityId(row.userId),
        status: row.status as ProjectMemberStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(entity: ProjectMember): DrizzleProjectMemberInsert {
    return {
      id: entity.id.toString(),
      projectId: entity.projectId.toString(),
      userId: entity.userId.toString(),
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt ?? undefined,
    }
  }
}
