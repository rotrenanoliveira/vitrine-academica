import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { ExportUserDataUseCase } from '@/domain/identity/application/use-cases/user/export-user-data'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAccountsRepository } from '@/infra/database/repositories/drizzle-accounts-repository'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzlePointTransactionsRepository } from '@/infra/database/repositories/drizzle-point-transactions-repository'
import { DrizzlePreferenceTagsRepository } from '@/infra/database/repositories/drizzle-preference-tags-repository'
import { DrizzleSessionsRepository } from '@/infra/database/repositories/drizzle-sessions-repository'
import { DrizzleUserDataExportRepository } from '@/infra/database/repositories/drizzle-user-data-export-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { ExportUserDataController } from '@/infra/http/controllers/user/export-user-data.controller'

export function makeExportUserDataController(): ExportUserDataController {
  const usersRepository = new DrizzleUsersRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const sessionsRepository = new DrizzleSessionsRepository(db)
  const preferenceTagsRepository = new DrizzlePreferenceTagsRepository(db)
  const accountsRepository = new DrizzleAccountsRepository(db)
  const pointTransactionsRepository = new DrizzlePointTransactionsRepository(db)
  const userDataExportRepository = new DrizzleUserDataExportRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)

  const registerLog = new RegisterLogUseCase(auditLogsRepository)

  const exportUserDataUseCase = new ExportUserDataUseCase(
    usersRepository,
    accountsRepository,
    sessionsRepository,
    institutionMembersRepository,
    preferenceTagsRepository,
    pointTransactionsRepository,
    userDataExportRepository,
    registerLog,
  )

  return new ExportUserDataController(exportUserDataUseCase)
}
