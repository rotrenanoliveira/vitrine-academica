import { RegisterUserUseCase } from '@/domain/identity/application/use-cases/user/register-user'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAccountsRepository } from '@/infra/database/repositories/drizzle-accounts-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { RegisterUserController } from '../../controllers/user/register-user.controller'

export function makeRegisterUserController() {
  const usersRepository = new DrizzleUsersRepository(db)
  const accountsRepository = new DrizzleAccountsRepository(db)
  const registerUserUseCase = new RegisterUserUseCase(usersRepository, accountsRepository)

  return new RegisterUserController(registerUserUseCase)
}
