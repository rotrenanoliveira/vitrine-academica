import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { EventRegistration, type EventRegistrationStatus } from '@/domain/event/enterprise/entities/event-registration'
import type { eventRegistrations } from '../schemas/event-registrations'

type DrizzleRegistration = typeof eventRegistrations.$inferSelect
type DrizzleRegistrationInsert = typeof eventRegistrations.$inferInsert

export class DrizzleEventRegistrationMapper {
  static toDomain(row: DrizzleRegistration): EventRegistration {
    return EventRegistration.create(
      {
        eventId: new UniqueEntityId(row.eventId),
        projectId: new UniqueEntityId(row.projectId),
        responsibleUserId: new UniqueEntityId(row.responsibleUserId),
        status: row.status as EventRegistrationStatus,
        reviewedByUserId: row.reviewedByUserId ? new UniqueEntityId(row.reviewedByUserId) : null,
        reviewedAt: row.reviewedAt,
        reviewReason: row.reviewReason,
        registeredAt: row.registeredAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(registration: EventRegistration): DrizzleRegistrationInsert {
    return {
      id: registration.id.toString(),
      eventId: registration.eventId.toString(),
      projectId: registration.projectId.toString(),
      responsibleUserId: registration.responsibleUserId.toString(),
      status: registration.status,
      reviewedByUserId: registration.reviewedByUserId?.toString() ?? null,
      reviewedAt: registration.reviewedAt,
      reviewReason: registration.reviewReason,
      registeredAt: registration.registeredAt,
    }
  }
}
