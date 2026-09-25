import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { UpdateInstitutionMemberRoleUseCase } from '@/domain/institution/application/use-cases/institution-member/update-institution-member-role'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { UpdateInstitutionMemberRoleController } from '../../controllers/institution-member/update-institution-member-role.controller'

export function makeUpdateInstitutionMemberRoleController() {
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const updateInstitutionMemberRoleUseCase = new UpdateInstitutionMemberRoleUseCase(
    institutionMembersRepository,
    registerLogUseCase,
  )

  return new UpdateInstitutionMemberRoleController(updateInstitutionMemberRoleUseCase)
}
