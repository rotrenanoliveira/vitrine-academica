import { FetchPublishedProjectsTodayUseCase } from '@/domain/project/application/use-cases/fetch-published-projects-today'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectScheduledRepository } from '@/infra/database/repositories/drizzle-project-scheduled-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { FetchPublishedProjectsTodayController } from '../../controllers/project/fetch-published-projects-today.controller'

export function makeFetchPublishedProjectsTodayController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectScheduledRepository = new DrizzleProjectScheduledRepository(db)
  const fetchPublishedProjectsTodayUseCase = new FetchPublishedProjectsTodayUseCase(
    projectsRepository,
    projectScheduledRepository,
  )

  return new FetchPublishedProjectsTodayController(fetchPublishedProjectsTodayUseCase)
}
