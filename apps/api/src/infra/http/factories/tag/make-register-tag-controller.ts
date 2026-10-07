import { RegisterTagUseCase } from '@/domain/tag/application/use-cases/tag/register-tag'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { RegisterTagController } from '../../controllers/tag/register-tag.controller'

export function makeRegisterTagController() {
  const tagsRepository = new DrizzleTagsRepository(db)
  const registerTagUseCase = new RegisterTagUseCase(tagsRepository)

  return new RegisterTagController(registerTagUseCase)
}
