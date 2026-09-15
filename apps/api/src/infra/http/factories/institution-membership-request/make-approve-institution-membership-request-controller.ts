import { ApproveInstitutionMembershipRequestUseCase } from '@/domain/institution/application/use-cases/institution-membership-request/approve-institution-membership-request'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionMembershipRequestsRepository } from '@/infra/database/repositories/drizzle-institution-membership-requests-repository'
import { ApproveInstitutionMembershipRequestController } from '../../controllers/institution-membership-request/approve-institution-membership-request.controller'

export function makeApproveInstitutionMembershipRequestController() {
  const institutionMembershipRequestsRepository = new DrizzleInstitutionMembershipRequestsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const approveInstitutionMembershipRequestUseCase = new ApproveInstitutionMembershipRequestUseCase(
    institutionMembershipRequestsRepository,
    institutionMembersRepository,
  )

  return new ApproveInstitutionMembershipRequestController(approveInstitutionMembershipRequestUseCase)
}
