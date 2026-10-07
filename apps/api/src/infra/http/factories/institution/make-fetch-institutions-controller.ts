import { FetchInstitutionsUseCase } from '@/domain/institution/application/use-cases/institution/fetch-institutions'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { FetchInstitutionsController } from '../../controllers/institution/fetch-institutions.controller'

export function makeFetchInstitutionsController() {
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const fetchInstitutionsUseCase = new FetchInstitutionsUseCase(institutionsRepository)

  return new FetchInstitutionsController(fetchInstitutionsUseCase)
}
