import { FetchUserPreferenceTagsUseCase } from '@/domain/tag/application/use-cases/preference-tag/fetch-user-preference-tags'
import { db } from '@/infra/database/drizzle/client'
import { DrizzlePreferenceTagsRepository } from '@/infra/database/repositories/drizzle-preference-tags-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { FetchUserPreferenceTagsController } from '../../controllers/preference-tag/fetch-user-preference-tags.controller'

export function makeFetchUserPreferenceTagsController() {
  const preferenceTagsRepository = new DrizzlePreferenceTagsRepository(db)
  const usersRepository = new DrizzleUsersRepository(db)
  const fetchUserPreferenceTagsUseCase = new FetchUserPreferenceTagsUseCase(
    preferenceTagsRepository,
    usersRepository,
  )

  return new FetchUserPreferenceTagsController(fetchUserPreferenceTagsUseCase)
}
