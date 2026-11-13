import { FetchAuthorPublishedProjectsUseCase } from '@/domain/project/application/use-cases/project/fetch-author-published-projects'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAttachmentsRepository } from '@/infra/database/repositories/drizzle-attachments-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { FetchAuthorPublishedProjectsController } from '../../controllers/project/fetch-author-published-projects.controller'

export function makeFetchAuthorPublishedProjectsController() {
  const usersRepository = new DrizzleUsersRepository(db)
  const projectsRepository = new DrizzleProjectsRepository(db)
  const attachmentsRepository = new DrizzleAttachmentsRepository(db)
  const tagsRepository = new DrizzleTagsRepository(db)

  const fetchAuthorPublishedProjectsUseCase = new FetchAuthorPublishedProjectsUseCase(
    usersRepository,
    projectsRepository,
  )

  return new FetchAuthorPublishedProjectsController(
    fetchAuthorPublishedProjectsUseCase,
    attachmentsRepository,
    tagsRepository,
  )
}
