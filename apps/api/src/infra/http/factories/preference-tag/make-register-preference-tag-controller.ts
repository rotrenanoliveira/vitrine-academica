import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { RegisterPreferenceTagUseCase } from '@/domain/tag/application/use-cases/preference-tag/register-preference-tag'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzlePreferenceTagsRepository } from '@/infra/database/repositories/drizzle-preference-tags-repository'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { RegisterPreferenceTagController } from '../../controllers/preference-tag/register-preference-tag.controller'

export function makeRegisterPreferenceTagController() {
  const preferenceTagsRepository = new DrizzlePreferenceTagsRepository(db)
  const tagsRepository = new DrizzleTagsRepository(db)
  const usersRepository = new DrizzleUsersRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const registerPreferenceTagUseCase = new RegisterPreferenceTagUseCase(
    preferenceTagsRepository,
    tagsRepository,
    usersRepository,
    registerLogUseCase,
  )

  return new RegisterPreferenceTagController(registerPreferenceTagUseCase)
}
