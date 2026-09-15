import { ScheduleProjectUseCase } from '@/domain/project/application/use-cases/scheduled-project/schedule-project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectScheduledRepository } from '@/infra/database/repositories/drizzle-project-scheduled-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { ScheduleProjectController } from '../../controllers/project/schedule-project.controller'

export function makeScheduleProjectController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectScheduledRepository = new DrizzleProjectScheduledRepository(db)
  const scheduleProjectUseCase = new ScheduleProjectUseCase(projectsRepository, projectScheduledRepository)

  return new ScheduleProjectController(scheduleProjectUseCase)
}
