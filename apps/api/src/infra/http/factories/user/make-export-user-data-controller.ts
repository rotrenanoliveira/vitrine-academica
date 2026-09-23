import { ExportUserDataUseCase } from '@/domain/identity/application/use-cases/user/export-user-data'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzlePreferenceTagsRepository } from '@/infra/database/repositories/drizzle-preference-tags-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { ExportUserDataController } from '@/infra/http/controllers/user/export-user-data.controller'

export function makeExportUserDataController(): ExportUserDataController {
  const usersRepository = new DrizzleUsersRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const preferenceTagsRepository = new DrizzlePreferenceTagsRepository(db)
  const projectsRepository = new DrizzleProjectsRepository(db)

  const exportUserDataUseCase = new ExportUserDataUseCase(
    usersRepository,
    institutionMembersRepository,
    preferenceTagsRepository,
    projectsRepository,
  )

  return new ExportUserDataController(exportUserDataUseCase)
}
