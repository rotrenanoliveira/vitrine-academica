import { FetchPublishedProjectsTodayUseCase } from '@/domain/project/application/use-cases/fetch-published-projects-today'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAttachmentsRepository } from '@/infra/database/repositories/drizzle-attachments-repository'
import { DrizzleProjectScheduledRepository } from '@/infra/database/repositories/drizzle-project-scheduled-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { FetchPublishedProjectsTodayController } from '../../controllers/project/fetch-published-projects-today.controller'

export function makeFetchPublishedProjectsTodayController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectScheduledRepository = new DrizzleProjectScheduledRepository(db)
  const attachmentsRepository = new DrizzleAttachmentsRepository(db)
  const tagsRepository = new DrizzleTagsRepository(db)
  const fetchPublishedProjectsTodayUseCase = new FetchPublishedProjectsTodayUseCase(
    projectsRepository,
    projectScheduledRepository,
  )

  return new FetchPublishedProjectsTodayController(
    fetchPublishedProjectsTodayUseCase,
    attachmentsRepository,
    tagsRepository,
  )
}
