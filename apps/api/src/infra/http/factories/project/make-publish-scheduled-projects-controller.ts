import { PublishScheduledProjectsUseCase } from '@/domain/project/application/use-cases/scheduled-project/publish-scheduled-projects'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectScheduledRepository } from '@/infra/database/repositories/drizzle-project-scheduled-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { PublishScheduledProjectsController } from '../../controllers/project/publish-scheduled-projects.controller'

export function makePublishScheduledProjectsController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectScheduledRepository = new DrizzleProjectScheduledRepository(db)
  const publishScheduledProjectsUseCase = new PublishScheduledProjectsUseCase(
    projectsRepository,
    projectScheduledRepository,
  )

  return new PublishScheduledProjectsController(publishScheduledProjectsUseCase)
}
