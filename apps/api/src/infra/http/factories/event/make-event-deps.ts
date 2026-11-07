import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleEventRegistrationsRepository } from '@/infra/database/repositories/drizzle-event-registrations-repository'
import { DrizzleEventsRepository } from '@/infra/database/repositories/drizzle-events-repository'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleThemesRepository } from '@/infra/database/repositories/drizzle-themes-repository'
import { DrizzleVotesRepository } from '@/infra/database/repositories/drizzle-votes-repository'

export function makeEventDeps() {
  const eventsRepository = new DrizzleEventsRepository(db)
  const themesRepository = new DrizzleThemesRepository(db)
  const votesRepository = new DrizzleVotesRepository(db)
  const eventRegistrationsRepository = new DrizzleEventRegistrationsRepository(db)
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const projectsRepository = new DrizzleProjectsRepository(db)
  const registerLog = new RegisterLogUseCase(new DrizzleAuditLogsRepository(db))

  return {
    eventsRepository,
    themesRepository,
    votesRepository,
    eventRegistrationsRepository,
    institutionsRepository,
    institutionMembersRepository,
    projectsRepository,
    registerLog,
  }
}
