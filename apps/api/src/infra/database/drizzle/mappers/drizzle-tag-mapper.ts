import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Slug } from '@/core/entities/value-objects/slug'
import { Tag } from '@/domain/tag/enterprise/entities/tag'
import type { tags } from '../schemas/tags'

type DrizzleTag = typeof tags.$inferSelect
type DrizzleTagInsert = typeof tags.$inferInsert

export class DrizzleTagMapper {
  static toDomain(row: DrizzleTag): Tag {
    return Tag.create(
      {
        name: row.name,
        slug: Slug.create(row.slug),
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(tag: Tag): DrizzleTagInsert {
    return {
      id: tag.id.toString(),
      name: tag.name,
      slug: tag.slug.value,
    }
  }
}
