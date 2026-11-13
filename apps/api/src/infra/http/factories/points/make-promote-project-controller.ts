import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { PromoteProjectUseCase } from '@/domain/points/application/use-cases/promotion/promote-project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleProjectMembersRepository } from '@/infra/database/repositories/drizzle-project-members-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzlePromotionsRepository } from '@/infra/database/repositories/drizzle-promotions-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { PromoteProjectController } from '../../controllers/points/promote-project.controller'

export function makePromoteProjectController() {
  const registerLogUseCase = new RegisterLogUseCase(new DrizzleAuditLogsRepository(db))

  const promoteProjectUseCase = new PromoteProjectUseCase(
    new DrizzleUsersRepository(db),
    new DrizzleProjectsRepository(db),
    new DrizzleProjectMembersRepository(db),
    new DrizzlePromotionsRepository(db),
    registerLogUseCase,
  )

  return new PromoteProjectController(promoteProjectUseCase)
}
