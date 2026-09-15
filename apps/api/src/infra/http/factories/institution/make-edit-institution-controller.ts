import { EditInstitutionUseCase } from '@/domain/institution/application/use-cases/institution/edit-institution'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { EditInstitutionController } from '../../controllers/institution/edit-institution.controller'

export function makeEditInstitutionController() {
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const editInstitutionUseCase = new EditInstitutionUseCase(institutionsRepository, institutionMembersRepository)

  return new EditInstitutionController(editInstitutionUseCase)
}
