import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  PreferenceTag,
  type PreferenceTagStatus,
} from '@/domain/tag/enterprise/entities/preference-tag'
import type { preferenceTags } from '../schemas/preference-tags'

type DrizzlePreferenceTag = typeof preferenceTags.$inferSelect
type DrizzlePreferenceTagInsert = typeof preferenceTags.$inferInsert

export class DrizzlePreferenceTagMapper {
  static toDomain(row: DrizzlePreferenceTag): PreferenceTag {
    return PreferenceTag.create(
      {
        tagId: new UniqueEntityId(row.tagId),
        userId: new UniqueEntityId(row.userId),
        status: row.status as PreferenceTagStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(preferenceTag: PreferenceTag): DrizzlePreferenceTagInsert {
    return {
      id: preferenceTag.id.toString(),
      tagId: preferenceTag.tagId.toString(),
      userId: preferenceTag.userId.toString(),
      status: preferenceTag.status,
      createdAt: preferenceTag.createdAt,
      updatedAt: preferenceTag.updatedAt ?? undefined,
    }
  }
}
