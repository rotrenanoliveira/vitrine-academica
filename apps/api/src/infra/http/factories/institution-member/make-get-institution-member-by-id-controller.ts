import { GetInstitutionMemberByIdUseCase } from '@/domain/institution/application/use-cases/institution-member/get-institution-member-by-id'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { GetInstitutionMemberByIdController } from '../../controllers/institution-member/get-institution-member-by-id.controller'

export function makeGetInstitutionMemberByIdController() {
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const getInstitutionMemberByIdUseCase = new GetInstitutionMemberByIdUseCase(institutionMembersRepository)

  return new GetInstitutionMemberByIdController(getInstitutionMemberByIdUseCase)
}
