import { and, desc, eq } from 'drizzle-orm'
import type { EventRegistrationsRepository } from '@/domain/event/application/repositories/event-registrations-repository'
import { type EventRegistration, EventRegistrationStatus } from '@/domain/event/enterprise/entities/event-registration'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleEventRegistrationMapper } from '../drizzle/mappers/drizzle-event-registration-mapper'
import { eventRegistrations } from '../drizzle/schemas'

export class DrizzleEventRegistrationsRepository implements EventRegistrationsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<EventRegistration | null> {
    const [row] = await this.db.select().from(eventRegistrations).where(eq(eventRegistrations.id, id)).limit(1)

    return row ? DrizzleEventRegistrationMapper.toDomain(row) : null
  }

  async findByEventAndProject(eventId: string, projectId: string): Promise<EventRegistration | null> {
    const [row] = await this.db
      .select()
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.projectId, projectId)))
      .limit(1)

    return row ? DrizzleEventRegistrationMapper.toDomain(row) : null
  }

  async findManyByEventId(eventId: string, status?: EventRegistrationStatus): Promise<EventRegistration[]> {
    const conditions = [eq(eventRegistrations.eventId, eventId)]

    if (status) {
      conditions.push(eq(eventRegistrations.status, status))
    }

    const rows = await this.db
      .select()
      .from(eventRegistrations)
      .where(and(...conditions))
      .orderBy(desc(eventRegistrations.registeredAt))

    return rows.map(DrizzleEventRegistrationMapper.toDomain)
  }

  async findApprovedProjectIdsByEventId(eventId: string): Promise<string[]> {
    const rows = await this.db
      .select({ projectId: eventRegistrations.projectId })
      .from(eventRegistrations)
      .where(
        and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.status, EventRegistrationStatus.APPROVED)),
      )

    return rows.map((row) => row.projectId)
  }

  async create(registration: EventRegistration): Promise<void> {
    await this.db.insert(eventRegistrations).values(DrizzleEventRegistrationMapper.toPersistence(registration))
  }

  async save(registration: EventRegistration): Promise<void> {
    await this.db
      .update(eventRegistrations)
      .set(DrizzleEventRegistrationMapper.toPersistence(registration))
      .where(eq(eventRegistrations.id, registration.id.toString()))
  }
}
