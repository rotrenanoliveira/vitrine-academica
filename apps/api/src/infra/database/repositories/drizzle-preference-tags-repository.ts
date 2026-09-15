import { and, eq } from 'drizzle-orm'
import type { PreferenceTagsRepository } from '@/domain/tag/application/repositories/preference-tags-repository'
import type { PreferenceTag } from '@/domain/tag/enterprise/entities/preference-tag'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzlePreferenceTagMapper } from '../drizzle/mappers/drizzle-preference-tag-mapper'
import { preferenceTags } from '../drizzle/schemas'

export class DrizzlePreferenceTagsRepository implements PreferenceTagsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findByUserId(userId: string): Promise<PreferenceTag[]> {
    const rows = await this.db.select().from(preferenceTags).where(eq(preferenceTags.userId, userId))

    return rows.map(DrizzlePreferenceTagMapper.toDomain)
  }

  async findByUserIdAndTagId(userId: string, tagId: string): Promise<PreferenceTag | null> {
    const [row] = await this.db
      .select()
      .from(preferenceTags)
      .where(and(eq(preferenceTags.userId, userId), eq(preferenceTags.tagId, tagId)))
      .limit(1)

    if (!row) {
      return null
    }

    return DrizzlePreferenceTagMapper.toDomain(row)
  }

  async create(preferenceTag: PreferenceTag): Promise<void> {
    await this.db.insert(preferenceTags).values(DrizzlePreferenceTagMapper.toPersistence(preferenceTag))
  }

  async save(preferenceTag: PreferenceTag): Promise<void> {
    await this.db
      .update(preferenceTags)
      .set(DrizzlePreferenceTagMapper.toPersistence(preferenceTag))
      .where(eq(preferenceTags.id, preferenceTag.id.toString()))
  }
}
