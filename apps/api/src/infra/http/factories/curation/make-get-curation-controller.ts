import { GetCurationUseCase } from '@/domain/curation/application/use-cases/get-curation'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleCurationRepository } from '@/infra/database/repositories/drizzle-curation-repository'
import { GetCurationController } from '../../controllers/curation/get-curation.controller'

export function makeGetCurationController() {
  const curationRepository = new DrizzleCurationRepository(db)
  const getCurationUseCase = new GetCurationUseCase(curationRepository)

  return new GetCurationController(getCurationUseCase)
}
