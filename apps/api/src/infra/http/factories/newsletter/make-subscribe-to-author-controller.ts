import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { SubscribeToAuthorUseCase } from '@/domain/newsletter/application/use-cases/subscribe-to-author'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleAuthorSubscriptionsRepository } from '@/infra/database/repositories/drizzle-author-subscriptions-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { SubscribeToAuthorController } from '../../controllers/newsletter/subscribe-to-author.controller'

export function makeSubscribeToAuthorController() {
  const usersRepository = new DrizzleUsersRepository(db)
  const projectsRepository = new DrizzleProjectsRepository(db)
  const subscriptionsRepository = new DrizzleAuthorSubscriptionsRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const subscribeToAuthorUseCase = new SubscribeToAuthorUseCase(
    usersRepository,
    projectsRepository,
    subscriptionsRepository,
    registerLogUseCase,
  )

  return new SubscribeToAuthorController(subscribeToAuthorUseCase)
}
