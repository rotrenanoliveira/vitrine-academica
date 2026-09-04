import { RegisterUserUseCase } from '@/domain/application/use-cases/user/register-user'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { RegisterUserController } from '../../controllers/user/register-user.controller'

export function makeRegisterUserController() {
  const usersRepository = new DrizzleUsersRepository(db)
  const registerUserUseCase = new RegisterUserUseCase(usersRepository)

  return new RegisterUserController(registerUserUseCase)
}
