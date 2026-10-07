import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { EditInstitutionUseCase } from '@/domain/institution/application/use-cases/institution/edit-institution'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { EditInstitutionController } from '../../controllers/institution/edit-institution.controller'

export function makeEditInstitutionController() {
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const editInstitutionUseCase = new EditInstitutionUseCase(
    institutionsRepository,
    institutionMembersRepository,
    registerLogUseCase,
  )

  return new EditInstitutionController(editInstitutionUseCase)
}
