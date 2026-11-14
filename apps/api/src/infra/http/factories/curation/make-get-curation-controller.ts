import { GetCurationUseCase } from '@/domain/curation/application/use-cases/get-curation'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAttachmentsRepository } from '@/infra/database/repositories/drizzle-attachments-repository'
import { DrizzleCurationRepository } from '@/infra/database/repositories/drizzle-curation-repository'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { GetCurationController } from '../../controllers/curation/get-curation.controller'

export function makeGetCurationController() {
  const curationRepository = new DrizzleCurationRepository(db)
  const attachmentsRepository = new DrizzleAttachmentsRepository(db)
  const tagsRepository = new DrizzleTagsRepository(db)
  const getCurationUseCase = new GetCurationUseCase(curationRepository)

  return new GetCurationController(getCurationUseCase, attachmentsRepository, tagsRepository)
}
