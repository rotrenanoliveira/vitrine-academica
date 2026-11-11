import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Project, type ProjectStatus } from '@/domain/project/enterprise/entities/project'
import type { projects } from '../schemas/projects'

type DrizzleProject = typeof projects.$inferSelect
type DrizzleProjectInsert = typeof projects.$inferInsert

export class DrizzleProjectMapper {
  static toDomain(row: DrizzleProject): Project {
    return Project.create(
      {
        title: row.title,
        slug: row.slug,
        description: row.description,
        author: new UniqueEntityId(row.authorId),
        status: row.status as ProjectStatus,
        coverUrl: row.coverUrl ?? null,
        attachments: row.attachments ?? [],
        tags: row.tags ?? [],
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(project: Project): DrizzleProjectInsert {
    return {
      id: project.id.toString(),
      title: project.title,
      slug: project.slug,
      description: project.description,
      authorId: project.author.toString(),
      status: project.status,
      coverUrl: project.coverUrl,
      attachments: project.attachments,
      tags: project.tags,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt ?? undefined,
    }
  }
}
