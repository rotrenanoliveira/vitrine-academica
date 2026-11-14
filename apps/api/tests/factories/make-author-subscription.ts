import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  AuthorSubscription,
  type AuthorSubscriptionProps,
} from '@/domain/newsletter/enterprise/entities/author-subscription'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuthorSubscriptionsRepository } from '@/infra/database/repositories/drizzle-author-subscriptions-repository'

const { faker } = require('@faker-js/faker/locale/pt_BR')

export function makeAuthorSubscription(override: Partial<AuthorSubscriptionProps> = {}, id?: UniqueEntityId) {
  const subscription = AuthorSubscription.create(
    {
      subscriberId: new UniqueEntityId(),
      authorId: new UniqueEntityId(),
      email: faker.internet.email(),
      ...override,
    },
    id,
  )

  return { subscription }
}

export async function makeAuthorSubscriptionOnDatabase(
  override: Partial<AuthorSubscriptionProps> = {},
  id?: UniqueEntityId,
) {
  const { subscription } = makeAuthorSubscription(override, id)

  const authorSubscriptionsRepository = new DrizzleAuthorSubscriptionsRepository(db)

  await authorSubscriptionsRepository.create(subscription)

  return { subscription }
}
