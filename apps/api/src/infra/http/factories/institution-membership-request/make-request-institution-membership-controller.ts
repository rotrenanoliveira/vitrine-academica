import { RequestInstitutionMembershipUseCase } from '@/domain/institution/application/use-cases/institution-membership-request/request-institution-membership'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionMembershipRequestsRepository } from '@/infra/database/repositories/drizzle-institution-membership-requests-repository'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { RequestInstitutionMembershipController } from '../../controllers/institution-membership-request/request-institution-membership.controller'

export function makeRequestInstitutionMembershipController() {
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const institutionMembershipRequestsRepository = new DrizzleInstitutionMembershipRequestsRepository(db)
  const requestInstitutionMembershipUseCase = new RequestInstitutionMembershipUseCase(
    institutionsRepository,
    institutionMembersRepository,
    institutionMembershipRequestsRepository,
  )

  return new RequestInstitutionMembershipController(requestInstitutionMembershipUseCase)
}
