import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { RegisterInstitutionUseCase } from '@/domain/institution/application/use-cases/institution/register-institution'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { RegisterInstitutionController } from '../../controllers/institution/register-institution.controller'

export function makeRegisterInstitutionController() {
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const registerInstitutionUseCase = new RegisterInstitutionUseCase(
    institutionsRepository,
    institutionMembersRepository,
    registerLogUseCase,
  )

  return new RegisterInstitutionController(registerInstitutionUseCase)
}
