import { faker } from '@faker-js/faker/locale/pt_BR'

import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Slug } from '@/core/entities/value-objects/slug'
import { Event, type EventProps, ParticipationScope } from '@/domain/event/enterprise/entities/event'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleEventsRepository } from '@/infra/database/repositories/drizzle-events-repository'

export function makeEvent(override: Partial<EventProps> = {}, id?: UniqueEntityId) {
  const name = override.name ?? faker.lorem.words(3)
  const event = Event.create(
    {
      institutionId: override.institutionId ?? new UniqueEntityId(),
      slug: override.slug ?? `evento-${Slug.createFromText(name ?? 'sem-nome').value}`,
      name,
      participationScope: override.participationScope ?? ParticipationScope.GLOBAL,
      startsAt: override.startsAt ?? new Date(),
      ...override,
    },
    id,
  )

  return { event }
}

export async function makeEventOnDatabase(override: Partial<EventProps> = {}, id?: UniqueEntityId) {
  const { event } = makeEvent(override, id)
  await new DrizzleEventsRepository(db).create(event)
  return { event }
}
