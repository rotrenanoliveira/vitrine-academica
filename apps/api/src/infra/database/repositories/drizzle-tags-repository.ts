import { eq } from 'drizzle-orm'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import type { Tag } from '@/domain/tag/enterprise/entities/tag'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleTagMapper } from '../drizzle/mappers/drizzle-tag-mapper'
import { tags } from '../drizzle/schemas'

export class DrizzleTagsRepository implements TagsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findAll(): Promise<Tag[]> {
    const rows = await this.db.select().from(tags)

    return rows.map(DrizzleTagMapper.toDomain)
  }

  async findById(id: string): Promise<Tag | null> {
    const [row] = await this.db.select().from(tags).where(eq(tags.id, id)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleTagMapper.toDomain(row)
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const [row] = await this.db.select().from(tags).where(eq(tags.slug, slug)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleTagMapper.toDomain(row)
  }

  async create(tag: Tag): Promise<void> {
    await this.db.insert(tags).values(DrizzleTagMapper.toPersistence(tag))
  }

  async save(tag: Tag): Promise<void> {
    await this.db
      .update(tags)
      .set(DrizzleTagMapper.toPersistence(tag))
      .where(eq(tags.id, tag.id.toString()))
  }
}
