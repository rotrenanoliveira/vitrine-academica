import { UpdateInstitutionMemberStatusUseCase } from '@/domain/institution/application/use-cases/institution-member/update-institution-member-status'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { UpdateInstitutionMemberStatusController } from '../../controllers/institution-member/update-institution-member-status.controller'

export function makeUpdateInstitutionMemberStatusController() {
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const updateInstitutionMemberStatusUseCase = new UpdateInstitutionMemberStatusUseCase(institutionMembersRepository)

  return new UpdateInstitutionMemberStatusController(updateInstitutionMemberStatusUseCase)
}
