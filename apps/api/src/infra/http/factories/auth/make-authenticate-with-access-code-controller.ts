import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuthenticateWithAccessCodeUseCase } from '@/domain/identity/application/use-cases/auth/authenticate-with-access-code'
import { BcryptHasher } from '@/infra/cryptography/bcrypt-hasher'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAccessCodesRepository } from '@/infra/database/repositories/drizzle-access-codes-repository'
import { DrizzleAccountsRepository } from '@/infra/database/repositories/drizzle-accounts-repository'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleSessionsRepository } from '@/infra/database/repositories/drizzle-sessions-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { AuthenticateWithAccessCodeController } from '../../controllers/auth/authenticate-with-access-code.controller'

export function makeAuthenticateWithAccessCodeController() {
  const usersRepository = new DrizzleUsersRepository(db)
  const accountsRepository = new DrizzleAccountsRepository(db)
  const accessCodesRepository = new DrizzleAccessCodesRepository(db)
  const sessionsRepository = new DrizzleSessionsRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const hasher = new BcryptHasher()
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)

  const authenticateWithAccessCodeUseCase = new AuthenticateWithAccessCodeUseCase(
    usersRepository,
    accountsRepository,
    accessCodesRepository,
    sessionsRepository,
    hasher,
    registerLogUseCase,
  )

  return new AuthenticateWithAccessCodeController(authenticateWithAccessCodeUseCase)
}
