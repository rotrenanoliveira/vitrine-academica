import type { EventRegistration, EventRegistrationStatus } from '../../enterprise/entities/event-registration'

export interface EventRegistrationsRepository {
  findById(id: string): Promise<EventRegistration | null>
  findByEventAndProject(eventId: string, projectId: string): Promise<EventRegistration | null>
  findManyByEventId(eventId: string, status?: EventRegistrationStatus): Promise<EventRegistration[]>
  findApprovedProjectIdsByEventId(eventId: string): Promise<string[]>
  create(registration: EventRegistration): Promise<void>
  save(registration: EventRegistration): Promise<void>
}
