import { and, eq, inArray } from 'drizzle-orm'
import type { ProjectTagsRepository } from '@/domain/project/application/repositories/project-tags-repository'
import type { ProjectTag } from '@/domain/project/enterprise/entities/project-tag'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleProjectTagMapper } from '../drizzle/mappers/drizzle-project-tag-mapper'
import { projectTags } from '../drizzle/schemas'

export class DrizzleProjectTagsRepository implements ProjectTagsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findByProjectId(projectId: string): Promise<ProjectTag[]> {
    const rows = await this.db.select().from(projectTags).where(eq(projectTags.projectId, projectId))

    return rows.map(DrizzleProjectTagMapper.toDomain)
  }

  async findByTagId(tagId: string): Promise<ProjectTag[]> {
    const rows = await this.db.select().from(projectTags).where(eq(projectTags.tagId, tagId))

    return rows.map(DrizzleProjectTagMapper.toDomain)
  }

  async findByTagIds(tagIds: string[]): Promise<ProjectTag[]> {
    if (tagIds.length === 0) {
      return []
    }

    const rows = await this.db.select().from(projectTags).where(inArray(projectTags.tagId, tagIds))

    return rows.map(DrizzleProjectTagMapper.toDomain)
  }

  async findByProjectIdAndTagId(projectId: string, tagId: string): Promise<ProjectTag | null> {
    const [row] = await this.db
      .select()
      .from(projectTags)
      .where(and(eq(projectTags.projectId, projectId), eq(projectTags.tagId, tagId)))
      .limit(1)

    if (!row) {
      return null
    }

    return DrizzleProjectTagMapper.toDomain(row)
  }

  async create(projectTag: ProjectTag): Promise<void> {
    await this.db.insert(projectTags).values(DrizzleProjectTagMapper.toPersistence(projectTag))
  }
}
