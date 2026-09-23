import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { UpdateInstitutionMemberStatusUseCase } from '@/domain/institution/application/use-cases/institution-member/update-institution-member-status'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { UpdateInstitutionMemberStatusController } from '../../controllers/institution-member/update-institution-member-status.controller'

export function makeUpdateInstitutionMemberStatusController() {
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const updateInstitutionMemberStatusUseCase = new UpdateInstitutionMemberStatusUseCase(
    institutionMembersRepository,
    registerLogUseCase,
  )

  return new UpdateInstitutionMemberStatusController(updateInstitutionMemberStatusUseCase)
}
