import { GetInstitutionByIdUseCase } from '@/domain/institution/application/use-cases/institution/get-institution-by-id'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { GetInstitutionByIdController } from '../../controllers/institution/get-institution-by-id.controller'

export function makeGetInstitutionByIdController() {
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const getInstitutionByIdUseCase = new GetInstitutionByIdUseCase(institutionsRepository)

  return new GetInstitutionByIdController(getInstitutionByIdUseCase)
}
