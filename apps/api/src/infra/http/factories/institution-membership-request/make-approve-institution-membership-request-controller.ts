import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { ApproveInstitutionMembershipRequestUseCase } from '@/domain/institution/application/use-cases/institution-membership-request/approve-institution-membership-request'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionMembershipRequestsRepository } from '@/infra/database/repositories/drizzle-institution-membership-requests-repository'
import { ApproveInstitutionMembershipRequestController } from '../../controllers/institution-membership-request/approve-institution-membership-request.controller'

export function makeApproveInstitutionMembershipRequestController() {
  const institutionMembershipRequestsRepository = new DrizzleInstitutionMembershipRequestsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const approveInstitutionMembershipRequestUseCase = new ApproveInstitutionMembershipRequestUseCase(
    institutionMembershipRequestsRepository,
    institutionMembersRepository,
    registerLogUseCase,
  )

  return new ApproveInstitutionMembershipRequestController(approveInstitutionMembershipRequestUseCase)
}
