import { FetchTagsUseCase } from '@/domain/tag/application/use-cases/tag/fetch-tags'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { FetchTagsController } from '../../controllers/tag/fetch-tags.controller'

export function makeFetchTagsController() {
  const tagsRepository = new DrizzleTagsRepository(db)
  const fetchTagsUseCase = new FetchTagsUseCase(tagsRepository)

  return new FetchTagsController(fetchTagsUseCase)
}
