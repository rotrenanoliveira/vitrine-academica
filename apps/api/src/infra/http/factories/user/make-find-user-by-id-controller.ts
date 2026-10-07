import { FindUserByIdUseCase } from '@/domain/identity/application/use-cases/user/find-user-by-id'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAccountsRepository } from '@/infra/database/repositories/drizzle-accounts-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { FindUserByIdController } from '../../controllers/user/find-user-by-id.controller'

export function makeFindUserByIdController() {
  const usersRepository = new DrizzleUsersRepository(db)
  const accountsRepository = new DrizzleAccountsRepository(db)
  const findUserByIdUseCase = new FindUserByIdUseCase(usersRepository, accountsRepository)

  return new FindUserByIdController(findUserByIdUseCase)
}
