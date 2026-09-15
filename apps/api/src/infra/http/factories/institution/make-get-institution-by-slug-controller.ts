import { GetInstitutionBySlugUseCase } from '@/domain/institution/application/use-cases/institution/get-institution-by-slug'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { GetInstitutionBySlugController } from '../../controllers/institution/get-institution-by-slug.controller'

export function makeGetInstitutionBySlugController() {
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const getInstitutionBySlugUseCase = new GetInstitutionBySlugUseCase(institutionsRepository)

  return new GetInstitutionBySlugController(getInstitutionBySlugUseCase)
}
