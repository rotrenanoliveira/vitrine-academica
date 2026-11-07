import type { Event, EventPhase } from '../../enterprise/entities/event'

export interface FetchPublicEventsParams {
  page?: number
  perPage?: number
  institutionId?: string
  phase?: EventPhase
}

export interface FetchInstitutionEventsParams {
  institutionId: string
  page?: number
  perPage?: number
  phase?: EventPhase
}

export interface EventsRepository {
  findById(id: string): Promise<Event | null>
  findBySlug(slug: string): Promise<Event | null>
  findManyPublic(params?: FetchPublicEventsParams): Promise<Event[]>
  findManyByInstitutionId(params: FetchInstitutionEventsParams): Promise<Event[]>
  findDueForThemeSelectionClose(now: Date): Promise<Event[]>
  findDueForClosing(now: Date): Promise<Event[]>

  tryAdvanceFromThemeSelection(eventId: string, now: Date): Promise<boolean>
  tryAdvanceFromOpenToClosed(eventId: string, now: Date): Promise<boolean>

  create(event: Event): Promise<void>
  save(event: Event): Promise<void>
}
