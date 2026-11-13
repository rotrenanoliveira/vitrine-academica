import { CreatePublicationNotificationsUseCase } from '@/domain/newsletter/application/use-cases/create-publication-notifications'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuthorSubscriptionsRepository } from '@/infra/database/repositories/drizzle-author-subscriptions-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzlePublicationNotificationsRepository } from '@/infra/database/repositories/drizzle-publication-notifications-repository'

export function makePublicationNotifier() {
  return new CreatePublicationNotificationsUseCase(
    new DrizzleProjectsRepository(db),
    new DrizzleAuthorSubscriptionsRepository(db),
    new DrizzlePublicationNotificationsRepository(db),
  )
}
