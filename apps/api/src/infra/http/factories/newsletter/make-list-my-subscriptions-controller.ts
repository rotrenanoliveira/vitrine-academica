import { ListMySubscriptionsUseCase } from '@/domain/newsletter/application/use-cases/list-my-subscriptions'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuthorSubscriptionsRepository } from '@/infra/database/repositories/drizzle-author-subscriptions-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { ListMySubscriptionsController } from '../../controllers/newsletter/list-my-subscriptions.controller'

export function makeListMySubscriptionsController() {
  const usersRepository = new DrizzleUsersRepository(db)
  const subscriptionsRepository = new DrizzleAuthorSubscriptionsRepository(db)
  const listMySubscriptionsUseCase = new ListMySubscriptionsUseCase(usersRepository, subscriptionsRepository)

  return new ListMySubscriptionsController(listMySubscriptionsUseCase)
}
