import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { UnsubscribeFromAuthorUseCase } from '@/domain/newsletter/application/use-cases/unsubscribe-from-author'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleAuthorSubscriptionsRepository } from '@/infra/database/repositories/drizzle-author-subscriptions-repository'
import { UnsubscribeFromAuthorController } from '../../controllers/newsletter/unsubscribe-from-author.controller'

export function makeUnsubscribeFromAuthorController() {
  const subscriptionsRepository = new DrizzleAuthorSubscriptionsRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const unsubscribeFromAuthorUseCase = new UnsubscribeFromAuthorUseCase(subscriptionsRepository, registerLogUseCase)

  return new UnsubscribeFromAuthorController(unsubscribeFromAuthorUseCase)
}
