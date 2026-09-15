import { RejectInstitutionMembershipRequestUseCase } from '@/domain/institution/application/use-cases/institution-membership-request/reject-institution-membership-request'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionMembershipRequestsRepository } from '@/infra/database/repositories/drizzle-institution-membership-requests-repository'
import { RejectInstitutionMembershipRequestController } from '../../controllers/institution-membership-request/reject-institution-membership-request.controller'

export function makeRejectInstitutionMembershipRequestController() {
  const institutionMembershipRequestsRepository = new DrizzleInstitutionMembershipRequestsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const rejectInstitutionMembershipRequestUseCase = new RejectInstitutionMembershipRequestUseCase(
    institutionMembershipRequestsRepository,
    institutionMembersRepository,
  )

  return new RejectInstitutionMembershipRequestController(rejectInstitutionMembershipRequestUseCase)
}
