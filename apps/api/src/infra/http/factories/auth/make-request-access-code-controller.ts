import { RequestAccessCodeUseCase } from '@/domain/identity/application/use-cases/auth/request-access-code'
import { BcryptHasher } from '@/infra/cryptography/bcrypt-hasher'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAccessCodesRepository } from '@/infra/database/repositories/drizzle-access-codes-repository'
import { DrizzleAccountsRepository } from '@/infra/database/repositories/drizzle-accounts-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { makeEmail } from '@/infra/mail/make-mail'
import { RequestAccessCodeController } from '../../controllers/auth/request-access-code.controller'

export function makeRequestAccessCodeController() {
  const usersRepository = new DrizzleUsersRepository(db)
  const accountsRepository = new DrizzleAccountsRepository(db)
  const accessCodesRepository = new DrizzleAccessCodesRepository(db)
  const hasher = new BcryptHasher()
  const mail = makeEmail()

  const requestAccessCodeUseCase = new RequestAccessCodeUseCase(
    usersRepository,
    accountsRepository,
    accessCodesRepository,
    hasher,
    mail,
  )

  return new RequestAccessCodeController(requestAccessCodeUseCase)
}
