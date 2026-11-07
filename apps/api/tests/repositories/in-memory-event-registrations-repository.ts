import type { EventRegistrationsRepository } from '@/domain/event/application/repositories/event-registrations-repository'
import { type EventRegistration, EventRegistrationStatus } from '@/domain/event/enterprise/entities/event-registration'

export class InMemoryEventRegistrationsRepository implements EventRegistrationsRepository {
  public items: EventRegistration[] = []

  async findById(id: string): Promise<EventRegistration | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findByEventAndProject(eventId: string, projectId: string): Promise<EventRegistration | null> {
    return (
      this.items.find((item) => item.eventId.toString() === eventId && item.projectId.toString() === projectId) ?? null
    )
  }

  async findManyByEventId(eventId: string, status?: EventRegistrationStatus): Promise<EventRegistration[]> {
    return this.items
      .filter((item) => {
        if (item.eventId.toString() !== eventId) return false
        if (status && item.status !== status) return false
        return true
      })
      .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime())
  }

  async findApprovedProjectIdsByEventId(eventId: string): Promise<string[]> {
    return this.items
      .filter((item) => item.eventId.toString() === eventId && item.status === EventRegistrationStatus.APPROVED)
      .map((item) => item.projectId.toString())
  }

  async create(registration: EventRegistration): Promise<void> {
    const existing = await this.findByEventAndProject(
      registration.eventId.toString(),
      registration.projectId.toString(),
    )
    if (existing) {
      throw new Error('DuplicateRegistrationError')
    }
    this.items.push(registration)
  }

  async save(registration: EventRegistration): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === registration.id.toString())
    if (index === -1) return
    this.items[index] = registration
  }
}
