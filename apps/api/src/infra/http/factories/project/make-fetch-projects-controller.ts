import { FetchProjectsUseCase } from '@/domain/project/application/use-cases/project/fetch-projects'
import { FetchUserPreferenceTagsUseCase } from '@/domain/tag/application/use-cases/preference-tag/fetch-user-preference-tags'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAttachmentsRepository } from '@/infra/database/repositories/drizzle-attachments-repository'
import { DrizzlePreferenceTagsRepository } from '@/infra/database/repositories/drizzle-preference-tags-repository'
import { DrizzleProjectTagsRepository } from '@/infra/database/repositories/drizzle-project-tags-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { FetchProjectsController } from '../../controllers/project/fetch-projects.controller'

export function makeFetchProjectsController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectTagsRepository = new DrizzleProjectTagsRepository(db)
  const preferenceTagsRepository = new DrizzlePreferenceTagsRepository(db)
  const usersRepository = new DrizzleUsersRepository(db)
  const attachmentsRepository = new DrizzleAttachmentsRepository(db)
  const tagsRepository = new DrizzleTagsRepository(db)
  const fetchProjectsUseCase = new FetchProjectsUseCase(projectsRepository, projectTagsRepository)
  const fetchUserPreferenceTagsUseCase = new FetchUserPreferenceTagsUseCase(preferenceTagsRepository, usersRepository)

  return new FetchProjectsController(
    fetchProjectsUseCase,
    fetchUserPreferenceTagsUseCase,
    attachmentsRepository,
    tagsRepository,
  )
}
