import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { UnsubscribeByTokenUseCase } from '@/domain/newsletter/application/use-cases/unsubscribe-by-token'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleAuthorSubscriptionsRepository } from '@/infra/database/repositories/drizzle-author-subscriptions-repository'
import { UnsubscribeByTokenController } from '../../controllers/newsletter/unsubscribe-by-token.controller'

export function makeUnsubscribeByTokenController() {
  const subscriptionsRepository = new DrizzleAuthorSubscriptionsRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const unsubscribeByTokenUseCase = new UnsubscribeByTokenUseCase(subscriptionsRepository, registerLogUseCase)

  return new UnsubscribeByTokenController(unsubscribeByTokenUseCase)
}
