import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { DeleteUserAccountUseCase } from '@/domain/identity/application/use-cases/user/delete-user-account'
import { DeleteAttachmentUseCase } from '@/domain/storage/application/use-cases/delete-attachment'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAccountsRepository } from '@/infra/database/repositories/drizzle-accounts-repository'
import { DrizzleAttachmentsRepository } from '@/infra/database/repositories/drizzle-attachments-repository'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { DrizzleSessionsRepository } from '@/infra/database/repositories/drizzle-sessions-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { makeStorage } from '@/infra/storage/make-storage'
import { DeleteUserAccountController } from '../../controllers/user/delete-user-account.controller'

export function makeDeleteUserAccountController() {
  const usersRepository = new DrizzleUsersRepository(db)
  const accountsRepository = new DrizzleAccountsRepository(db)
  const sessionsRepository = new DrizzleSessionsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const attachmentsRepository = new DrizzleAttachmentsRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)

  const storage = makeStorage()
  const deleteAttachmentUseCase = new DeleteAttachmentUseCase(attachmentsRepository, storage)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)

  const deleteUserAccountUseCase = new DeleteUserAccountUseCase(
    usersRepository,
    accountsRepository,
    sessionsRepository,
    institutionMembersRepository,
    institutionsRepository,
    deleteAttachmentUseCase,
    registerLogUseCase,
  )

  return new DeleteUserAccountController(deleteUserAccountUseCase)
}
