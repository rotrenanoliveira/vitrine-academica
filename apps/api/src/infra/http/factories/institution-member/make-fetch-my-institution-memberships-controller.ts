import { FetchMyInstitutionMembershipsUseCase } from '@/domain/institution/application/use-cases/institution-member/fetch-my-institution-memberships'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { FetchMyInstitutionMembershipsController } from '../../controllers/institution-member/fetch-my-institution-memberships.controller'

export function makeFetchMyInstitutionMembershipsController() {
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const fetchMyInstitutionMembershipsUseCase = new FetchMyInstitutionMembershipsUseCase(institutionMembersRepository)

  return new FetchMyInstitutionMembershipsController(fetchMyInstitutionMembershipsUseCase)
}
