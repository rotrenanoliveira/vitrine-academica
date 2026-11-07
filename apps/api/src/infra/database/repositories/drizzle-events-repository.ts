import { and, desc, eq, inArray, lte, or } from 'drizzle-orm'
import type {
  EventsRepository,
  FetchInstitutionEventsParams,
  FetchPublicEventsParams,
} from '@/domain/event/application/repositories/events-repository'
import { type Event, EventPhase, ParticipationScope } from '@/domain/event/enterprise/entities/event'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleEventMapper } from '../drizzle/mappers/drizzle-event-mapper'
import { events } from '../drizzle/schemas'

export class DrizzleEventsRepository implements EventsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<Event | null> {
    const [row] = await this.db.select().from(events).where(eq(events.id, id)).limit(1)
    return row ? DrizzleEventMapper.toDomain(row) : null
  }

  async findBySlug(slug: string): Promise<Event | null> {
    const [row] = await this.db.select().from(events).where(eq(events.slug, slug)).limit(1)
    return row ? DrizzleEventMapper.toDomain(row) : null
  }

  async findManyPublic(params: FetchPublicEventsParams = {}): Promise<Event[]> {
    const page = params.page ?? 1
    const perPage = params.perPage ?? 20
    const listedPhases = [EventPhase.OPEN, EventPhase.CLOSED] as const
    const earlyPhases = [EventPhase.THEME_SELECTION, EventPhase.INSTITUTIONAL_SELECTION] as const

    // Edições abertas/encerradas + ciclos globais ainda em preparação (descoberta da escolha de tema).
    const visibility = or(
      inArray(events.phase, [...listedPhases]),
      and(inArray(events.phase, [...earlyPhases]), eq(events.participationScope, ParticipationScope.GLOBAL)),
    )

    const conditions = [visibility]

    if (params.institutionId) {
      conditions.push(eq(events.institutionId, params.institutionId))
    }

    if (params.phase) {
      conditions.push(eq(events.phase, params.phase))
    }

    const rows = await this.db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(desc(events.startsAt))
      .limit(perPage)
      .offset((page - 1) * perPage)

    return rows.map(DrizzleEventMapper.toDomain)
  }

  async findManyByInstitutionId(params: FetchInstitutionEventsParams): Promise<Event[]> {
    const page = params.page ?? 1
    const perPage = params.perPage ?? 20
    const conditions = [eq(events.institutionId, params.institutionId)]

    if (params.phase) {
      conditions.push(eq(events.phase, params.phase))
    }

    const rows = await this.db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(desc(events.startsAt))
      .limit(perPage)
      .offset((page - 1) * perPage)

    return rows.map(DrizzleEventMapper.toDomain)
  }

  async findDueForThemeSelectionClose(now: Date): Promise<Event[]> {
    const rows = await this.db
      .select()
      .from(events)
      .where(and(eq(events.phase, EventPhase.THEME_SELECTION), lte(events.themeSelectionEndsAt, now)))

    return rows.map(DrizzleEventMapper.toDomain)
  }

  async findDueForClosing(now: Date): Promise<Event[]> {
    const rows = await this.db
      .select()
      .from(events)
      .where(and(eq(events.phase, EventPhase.OPEN), lte(events.endsAt, now)))

    return rows.map(DrizzleEventMapper.toDomain)
  }

  async create(event: Event): Promise<void> {
    await this.db.insert(events).values(DrizzleEventMapper.toPersistence(event))
  }

  async save(event: Event): Promise<void> {
    await this.db.update(events).set(DrizzleEventMapper.toPersistence(event)).where(eq(events.id, event.id.toString()))
  }

  async tryAdvanceFromThemeSelection(eventId: string, now: Date): Promise<boolean> {
    const result = await this.db
      .update(events)
      .set({
        phase: EventPhase.INSTITUTIONAL_SELECTION,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(events.id, eventId),
          eq(events.phase, EventPhase.THEME_SELECTION),
          lte(events.themeSelectionEndsAt, now),
        ),
      )
      .returning({ id: events.id })

    return result.length > 0
  }

  async tryAdvanceFromOpenToClosed(eventId: string, now: Date): Promise<boolean> {
    const result = await this.db
      .update(events)
      .set({
        phase: EventPhase.CLOSED,
        updatedAt: new Date(),
      })
      .where(and(eq(events.id, eventId), eq(events.phase, EventPhase.OPEN), lte(events.endsAt, now)))
      .returning({ id: events.id })

    return result.length > 0
  }
}
