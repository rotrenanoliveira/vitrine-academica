import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Event, type EventPhase, type ParticipationScope } from '@/domain/event/enterprise/entities/event'
import type { events } from '../schemas/events'

type DrizzleEvent = typeof events.$inferSelect
type DrizzleEventInsert = typeof events.$inferInsert

export class DrizzleEventMapper {
  static toDomain(row: DrizzleEvent): Event {
    return Event.create(
      {
        institutionId: new UniqueEntityId(row.institutionId),
        slug: row.slug,
        name: row.name,
        participationScope: row.participationScope as ParticipationScope,
        phase: row.phase as EventPhase,
        winnerThemeId: row.winnerThemeId ? new UniqueEntityId(row.winnerThemeId) : null,
        startsAt: row.startsAt,
        themeSelectionEndsAt: row.themeSelectionEndsAt,
        endsAt: row.endsAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(event: Event): DrizzleEventInsert {
    return {
      id: event.id.toString(),
      institutionId: event.institutionId.toString(),
      slug: event.slug,
      name: event.name,
      participationScope: event.participationScope,
      phase: event.phase,
      winnerThemeId: event.winnerThemeId?.toString() ?? null,
      startsAt: event.startsAt,
      themeSelectionEndsAt: event.themeSelectionEndsAt,
      endsAt: event.endsAt,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt ?? undefined,
    }
  }
}
