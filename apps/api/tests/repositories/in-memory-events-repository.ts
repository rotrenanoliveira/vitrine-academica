import type {
  EventListItem,
  EventsRepository,
  FetchInstitutionEventsParams,
  FetchPublicEventsParams,
  FetchPublicEventsResult,
} from '@/domain/event/application/repositories/events-repository'
import { type Event, EventPhase, ParticipationScope } from '@/domain/event/enterprise/entities/event'

export class InMemoryEventsRepository implements EventsRepository {
  public items: Event[] = []
  public themeTitlesById = new Map<string, string>()
  public institutionNamesById = new Map<string, string>()

  async findById(id: string): Promise<Event | null> {
    return this.items.find((event) => event.id.toString() === id) ?? null
  }

  async findBySlug(slug: string): Promise<Event | null> {
    return this.items.find((event) => event.slug === slug) ?? null
  }

  private toListItem(event: Event): EventListItem {
    const winnerThemeId = event.winnerThemeId?.toString()
    const institutionId = event.institutionId.toString()

    return {
      event,
      winner: winnerThemeId ? (this.themeTitlesById.get(winnerThemeId) ?? null) : null,
      institutionName: this.institutionNamesById.get(institutionId) ?? 'Instituição',
    }
  }

  private isPubliclyVisible(event: Event, phases?: EventPhase[]): boolean {
    if (phases && phases.length > 0) {
      return phases.includes(event.phase)
    }

    const earlyPhase = event.phase === EventPhase.THEME_SELECTION || event.phase === EventPhase.INSTITUTIONAL_SELECTION

    return event.isPubliclyListed() || (earlyPhase && event.participationScope === ParticipationScope.GLOBAL)
  }

  async findManyPublic(params: FetchPublicEventsParams = {}): Promise<FetchPublicEventsResult> {
    const page = params.page ?? 1
    const perPage = params.perPage ?? 30

    const filtered = this.items
      .filter((event) => {
        if (!this.isPubliclyVisible(event, params.phases)) return false

        if (
          params.institutionIds &&
          params.institutionIds.length > 0 &&
          !params.institutionIds.includes(event.institutionId.toString())
        ) {
          return false
        }

        if (params.participationScope && event.participationScope !== params.participationScope) return false
        return true
      })
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())

    const start = (page - 1) * perPage

    return {
      total: filtered.length,
      items: filtered.slice(start, start + perPage).map((event) => this.toListItem(event)),
    }
  }

  async findManyByInstitutionId(params: FetchInstitutionEventsParams): Promise<EventListItem[]> {
    const page = params.page ?? 1
    const perPage = params.perPage ?? 30

    const filtered = this.items
      .filter((event) => {
        if (event.institutionId.toString() !== params.institutionId) return false
        if (params.phase && event.phase !== params.phase) return false
        if (params.participationScope && event.participationScope !== params.participationScope) return false
        return true
      })
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())

    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage).map((event) => this.toListItem(event))
  }

  async findDueForThemeSelectionClose(now: Date): Promise<Event[]> {
    return this.items.filter((event) => event.phase === EventPhase.THEME_SELECTION && event.themeSelectionEndsAt <= now)
  }

  async findDueForClosing(now: Date): Promise<Event[]> {
    return this.items.filter((event) => event.phase === EventPhase.OPEN && event.endsAt <= now)
  }

  async create(event: Event): Promise<void> {
    this.items.push(event)
  }

  async save(event: Event): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === event.id.toString())
    if (index === -1) return
    this.items[index] = event
  }

  async tryAdvanceFromThemeSelection(eventId: string, now: Date): Promise<boolean> {
    const event = await this.findById(eventId)
    if (!event) return false
    if (event.phase !== EventPhase.THEME_SELECTION) return false
    if (event.themeSelectionEndsAt > now) return false

    event.closeThemeVoting()
    await this.save(event)
    return true
  }

  async tryAdvanceFromOpenToClosed(eventId: string, now: Date): Promise<boolean> {
    const event = await this.findById(eventId)
    if (!event) return false
    if (event.phase !== EventPhase.OPEN) return false
    if (event.endsAt > now) return false

    event.closeRegistrations()
    await this.save(event)
    return true
  }
}
