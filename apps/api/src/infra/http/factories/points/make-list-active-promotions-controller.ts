import { ListActivePromotionsUseCase } from '@/domain/points/application/use-cases/promotion/list-active-promotions'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzlePromotionsRepository } from '@/infra/database/repositories/drizzle-promotions-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { ListActivePromotionsController } from '../../controllers/points/list-active-promotions.controller'

export function makeListActivePromotionsController() {
  const listActivePromotionsUseCase = new ListActivePromotionsUseCase(
    new DrizzlePromotionsRepository(db),
    new DrizzleProjectsRepository(db),
    new DrizzleUsersRepository(db),
  )

  return new ListActivePromotionsController(listActivePromotionsUseCase)
}
