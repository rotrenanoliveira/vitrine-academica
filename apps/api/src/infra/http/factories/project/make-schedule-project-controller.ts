import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { ScheduleProjectUseCase } from '@/domain/project/application/use-cases/scheduled-project/schedule-project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleProjectScheduledRepository } from '@/infra/database/repositories/drizzle-project-scheduled-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { ScheduleProjectController } from '../../controllers/project/schedule-project.controller'

export function makeScheduleProjectController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectScheduledRepository = new DrizzleProjectScheduledRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const scheduleProjectUseCase = new ScheduleProjectUseCase(
    projectsRepository,
    projectScheduledRepository,
    registerLogUseCase,
  )

  return new ScheduleProjectController(scheduleProjectUseCase)
}
