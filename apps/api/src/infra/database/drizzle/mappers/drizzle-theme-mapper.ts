import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Theme, type ThemeStatus } from '@/domain/event/enterprise/entities/theme'
import type { eventThemes } from '../schemas/event-themes'

type DrizzleTheme = typeof eventThemes.$inferSelect
type DrizzleThemeInsert = typeof eventThemes.$inferInsert

export class DrizzleThemeMapper {
  static toDomain(row: DrizzleTheme): Theme {
    return Theme.create(
      {
        eventId: new UniqueEntityId(row.eventId),
        authorId: new UniqueEntityId(row.authorId),
        title: row.title,
        description: row.description,
        status: row.status as ThemeStatus,
        moderatedByUserId: row.moderatedByUserId ? new UniqueEntityId(row.moderatedByUserId) : null,
        moderatedAt: row.moderatedAt,
        moderationReason: row.moderationReason,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(theme: Theme): DrizzleThemeInsert {
    return {
      id: theme.id.toString(),
      eventId: theme.eventId.toString(),
      authorId: theme.authorId.toString(),
      title: theme.title,
      description: theme.description,
      status: theme.status,
      moderatedByUserId: theme.moderatedByUserId?.toString() ?? null,
      moderatedAt: theme.moderatedAt,
      moderationReason: theme.moderationReason,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt ?? undefined,
    }
  }
}
