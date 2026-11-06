import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { EventRegistration, type EventRegistrationProps } from '@/domain/event/enterprise/entities/event-registration'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleEventRegistrationsRepository } from '@/infra/database/repositories/drizzle-event-registrations-repository'

export function makeEventRegistration(override: Partial<EventRegistrationProps> = {}, id?: UniqueEntityId) {
  const registration = EventRegistration.create(
    {
      eventId: override.eventId ?? new UniqueEntityId(),
      projectId: override.projectId ?? new UniqueEntityId(),
      responsibleUserId: override.responsibleUserId ?? new UniqueEntityId(),
      ...override,
    },
    id,
  )

  return { registration }
}

export async function makeEventRegistrationOnDatabase(
  override: Partial<EventRegistrationProps> = {},
  id?: UniqueEntityId,
) {
  const { registration } = makeEventRegistration(override, id)
  await new DrizzleEventRegistrationsRepository(db).create(registration)
  return { registration }
}
