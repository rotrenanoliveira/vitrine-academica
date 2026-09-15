import { FetchProjectsOfInterestUseCase } from '@/domain/project/application/use-cases/project-tag/fetch-projects-of-interest'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectTagsRepository } from '@/infra/database/repositories/drizzle-project-tags-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzlePreferenceTagsRepository } from '@/infra/database/repositories/drizzle-preference-tags-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { FetchProjectsOfInterestController } from '../../controllers/project-tag/fetch-projects-of-interest.controller'

export function makeFetchProjectsOfInterestController() {
  const preferenceTagsRepository = new DrizzlePreferenceTagsRepository(db)
  const projectTagsRepository = new DrizzleProjectTagsRepository(db)
  const projectsRepository = new DrizzleProjectsRepository(db)
  const usersRepository = new DrizzleUsersRepository(db)
  const fetchProjectsOfInterestUseCase = new FetchProjectsOfInterestUseCase(
    preferenceTagsRepository,
    projectTagsRepository,
    projectsRepository,
    usersRepository,
  )

  return new FetchProjectsOfInterestController(fetchProjectsOfInterestUseCase)
}
