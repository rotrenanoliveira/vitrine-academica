import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { DeactivatePreferenceTagUseCase } from '@/domain/tag/application/use-cases/preference-tag/deactivate-preference-tag'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzlePreferenceTagsRepository } from '@/infra/database/repositories/drizzle-preference-tags-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { DeactivatePreferenceTagController } from '../../controllers/preference-tag/deactivate-preference-tag.controller'

export function makeDeactivatePreferenceTagController() {
  const preferenceTagsRepository = new DrizzlePreferenceTagsRepository(db)
  const usersRepository = new DrizzleUsersRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const deactivatePreferenceTagUseCase = new DeactivatePreferenceTagUseCase(
    preferenceTagsRepository,
    usersRepository,
    registerLogUseCase,
  )

  return new DeactivatePreferenceTagController(deactivatePreferenceTagUseCase)
}
