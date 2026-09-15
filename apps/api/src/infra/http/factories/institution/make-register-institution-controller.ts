import { RegisterInstitutionUseCase } from '@/domain/institution/application/use-cases/institution/register-institution'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { RegisterInstitutionController } from '../../controllers/institution/register-institution.controller'

export function makeRegisterInstitutionController() {
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const registerInstitutionUseCase = new RegisterInstitutionUseCase(
    institutionsRepository,
    institutionMembersRepository,
  )

  return new RegisterInstitutionController(registerInstitutionUseCase)
}
