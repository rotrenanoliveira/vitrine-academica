import { FetchInstitutionMembershipRequestsUseCase } from '@/domain/institution/application/use-cases/institution-membership-request/fetch-institution-membership-requests'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionMembershipRequestsRepository } from '@/infra/database/repositories/drizzle-institution-membership-requests-repository'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { FetchInstitutionMembershipRequestsController } from '../../controllers/institution-membership-request/fetch-institution-membership-requests.controller'

export function makeFetchInstitutionMembershipRequestsController() {
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const institutionMembershipRequestsRepository = new DrizzleInstitutionMembershipRequestsRepository(db)
  const fetchInstitutionMembershipRequestsUseCase = new FetchInstitutionMembershipRequestsUseCase(
    institutionsRepository,
    institutionMembersRepository,
    institutionMembershipRequestsRepository,
  )

  return new FetchInstitutionMembershipRequestsController(fetchInstitutionMembershipRequestsUseCase)
}
