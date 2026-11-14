import { and, count, desc, eq, inArray, lte, or, type SQL } from 'drizzle-orm'
import type {
  EventListItem,
  EventsRepository,
  FetchInstitutionEventsParams,
  FetchPublicEventsParams,
  FetchPublicEventsResult,
} from '@/domain/event/application/repositories/events-repository'
import { type Event, EventPhase, ParticipationScope } from '@/domain/event/enterprise/entities/event'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleEventMapper } from '../drizzle/mappers/drizzle-event-mapper'
import { events, eventThemes, institutions } from '../drizzle/schemas'

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

  private buildPublicVisibilityCondition(phases?: EventPhase[]): SQL | undefined {
    if (phases && phases.length > 0) {
      return inArray(events.phase, phases)
    }

    const listedPhases = [EventPhase.OPEN, EventPhase.CLOSED] as const
    const earlyPhases = [EventPhase.THEME_SELECTION, EventPhase.INSTITUTIONAL_SELECTION] as const

    // Edições abertas/encerradas + ciclos globais ainda em preparação (descoberta da escolha de tema).
    return or(
      inArray(events.phase, [...listedPhases]),
      and(inArray(events.phase, [...earlyPhases]), eq(events.participationScope, ParticipationScope.GLOBAL)),
    )
  }

  private buildPublicConditions(params: FetchPublicEventsParams): SQL[] {
    const conditions: SQL[] = []
    const visibility = this.buildPublicVisibilityCondition(params.phases)

    if (visibility) {
      conditions.push(visibility)
    }

    if (params.institutionIds && params.institutionIds.length > 0) {
      conditions.push(inArray(events.institutionId, params.institutionIds))
    }

    if (params.participationScope) {
      conditions.push(eq(events.participationScope, params.participationScope))
    }

    return conditions
  }

  async findManyPublic(params: FetchPublicEventsParams = {}): Promise<FetchPublicEventsResult> {
    const page = params.page ?? 1
    const perPage = params.perPage ?? 30
    const conditions = this.buildPublicConditions(params)
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [totalRow] = await this.db.select({ total: count() }).from(events).where(whereClause)

    const rows = await this.db
      .select({
        event: events,
        winner: eventThemes.title,
        institutionName: institutions.name,
      })
      .from(events)
      .leftJoin(eventThemes, eq(events.winnerThemeId, eventThemes.id))
      .leftJoin(institutions, eq(events.institutionId, institutions.id))
      .where(whereClause)
      .orderBy(desc(events.startsAt), desc(events.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage)

    return {
      total: totalRow?.total ?? 0,
      items: rows.map((row) => ({
        event: DrizzleEventMapper.toDomain(row.event),
        winner: row.winner ?? null,
        institutionName: row.institutionName ?? '',
      })),
    }
  }

  async findManyByInstitutionId(params: FetchInstitutionEventsParams): Promise<EventListItem[]> {
    const page = params.page ?? 1
    const perPage = params.perPage ?? 30
    const conditions = [eq(events.institutionId, params.institutionId)]

    if (params.phase) {
      conditions.push(eq(events.phase, params.phase))
    }

    if (params.participationScope) {
      conditions.push(eq(events.participationScope, params.participationScope))
    }

    const rows = await this.db
      .select({
        event: events,
        winner: eventThemes.title,
        institutionName: institutions.name,
      })
      .from(events)
      .leftJoin(eventThemes, eq(events.winnerThemeId, eventThemes.id))
      .leftJoin(institutions, eq(events.institutionId, institutions.id))
      .where(and(...conditions))
      .orderBy(desc(events.startsAt))
      .limit(perPage)
      .offset((page - 1) * perPage)

    return rows.map((row) => ({
      event: DrizzleEventMapper.toDomain(row.event),
      winner: row.winner ?? null,
      institutionName: row.institutionName ?? '',
    }))
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
