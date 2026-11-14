import type { Event, EventPhase, ParticipationScope } from '../../enterprise/entities/event'

export interface EventListItem {
  event: Event
  winner: string | null
  institutionName: string
}

export interface FetchPublicEventsParams {
  page?: number
  perPage?: number
  institutionIds?: string[]
  phases?: EventPhase[]
  participationScope?: ParticipationScope
}

export interface FetchPublicEventsResult {
  items: EventListItem[]
  total: number
}

export interface FetchInstitutionEventsParams {
  institutionId: string
  page?: number
  perPage?: number
  phase?: EventPhase
  participationScope?: ParticipationScope
}

export interface EventsRepository {
  findById(id: string): Promise<Event | null>
  findBySlug(slug: string): Promise<Event | null>
  findManyPublic(params?: FetchPublicEventsParams): Promise<FetchPublicEventsResult>
  findManyByInstitutionId(params: FetchInstitutionEventsParams): Promise<EventListItem[]>
  findDueForThemeSelectionClose(now: Date): Promise<Event[]>
  findDueForClosing(now: Date): Promise<Event[]>

  tryAdvanceFromThemeSelection(eventId: string, now: Date): Promise<boolean>
  tryAdvanceFromOpenToClosed(eventId: string, now: Date): Promise<boolean>

  create(event: Event): Promise<void>
  save(event: Event): Promise<void>
}
