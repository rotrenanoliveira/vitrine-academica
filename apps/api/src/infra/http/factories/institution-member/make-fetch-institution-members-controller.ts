import { FetchInstitutionMembersUseCase } from '@/domain/institution/application/use-cases/institution-member/fetch-institution-members'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { FetchInstitutionMembersController } from '../../controllers/institution-member/fetch-institution-members.controller'

export function makeFetchInstitutionMembersController() {
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const usersRepository = new DrizzleUsersRepository(db)
  const fetchInstitutionMembersUseCase = new FetchInstitutionMembersUseCase(
    institutionsRepository,
    institutionMembersRepository,
    usersRepository,
  )

  return new FetchInstitutionMembersController(fetchInstitutionMembersUseCase)
}
