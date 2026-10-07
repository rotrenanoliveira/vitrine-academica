import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { UpdateInstitutionStatusUseCase } from '@/domain/institution/application/use-cases/institution/update-institution-status'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { UpdateInstitutionStatusController } from '../../controllers/institution/update-institution-status.controller'

export function makeUpdateInstitutionStatusController() {
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const updateInstitutionStatusUseCase = new UpdateInstitutionStatusUseCase(
    institutionsRepository,
    institutionMembersRepository,
    registerLogUseCase,
  )

  return new UpdateInstitutionStatusController(updateInstitutionStatusUseCase)
}
