import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  PublicationNotification,
  type PublicationNotificationProps,
} from '@/domain/newsletter/enterprise/entities/publication-notification'
import { db } from '@/infra/database/drizzle/client'
import { DrizzlePublicationNotificationsRepository } from '@/infra/database/repositories/drizzle-publication-notifications-repository'

export function makePublicationNotification(override: Partial<PublicationNotificationProps> = {}, id?: UniqueEntityId) {
  const notification = PublicationNotification.create(
    {
      subscriptionId: new UniqueEntityId(),
      projectId: new UniqueEntityId(),
      ...override,
    },
    id,
  )

  return { notification }
}

export async function makePublicationNotificationOnDatabase(
  override: Partial<PublicationNotificationProps> = {},
  id?: UniqueEntityId,
) {
  const { notification } = makePublicationNotification(override, id)

  const publicationNotificationsRepository = new DrizzlePublicationNotificationsRepository(db)

  await publicationNotificationsRepository.create(notification)

  return { notification }
}
