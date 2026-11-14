import { FetchScheduledProjectsUseCase } from '@/domain/project/application/use-cases/scheduled-project/fetch-scheduled-projects'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAttachmentsRepository } from '@/infra/database/repositories/drizzle-attachments-repository'
import { DrizzleProjectScheduledRepository } from '@/infra/database/repositories/drizzle-project-scheduled-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { FetchScheduledProjectsController } from '../../controllers/project/fetch-scheduled-projects.controller'

export function makeFetchScheduledProjectsController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectScheduledRepository = new DrizzleProjectScheduledRepository(db)
  const attachmentsRepository = new DrizzleAttachmentsRepository(db)
  const tagsRepository = new DrizzleTagsRepository(db)
  const fetchScheduledProjectsUseCase = new FetchScheduledProjectsUseCase(
    projectsRepository,
    projectScheduledRepository,
  )

  return new FetchScheduledProjectsController(fetchScheduledProjectsUseCase, attachmentsRepository, tagsRepository)
}
