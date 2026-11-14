import { FetchInstitutionProjectsBySlugUseCase } from '@/domain/institution/application/use-cases/institution/fetch-institution-projects-by-slug'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAttachmentsRepository } from '@/infra/database/repositories/drizzle-attachments-repository'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'
import { DrizzleInstitutionsRepository } from '@/infra/database/repositories/drizzle-institutions-repository'
import { DrizzleProjectTagsRepository } from '@/infra/database/repositories/drizzle-project-tags-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { FetchInstitutionProjectsBySlugController } from '../../controllers/institution/fetch-institution-projects-by-slug.controller'

export function makeFetchInstitutionProjectsBySlugController() {
  const institutionsRepository = new DrizzleInstitutionsRepository(db)
  const institutionMembersRepository = new DrizzleInstitutionMembersRepository(db)
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectTagsRepository = new DrizzleProjectTagsRepository(db)
  const attachmentsRepository = new DrizzleAttachmentsRepository(db)
  const tagsRepository = new DrizzleTagsRepository(db)

  const fetchInstitutionProjectsBySlugUseCase = new FetchInstitutionProjectsBySlugUseCase(
    institutionsRepository,
    institutionMembersRepository,
    projectsRepository,
    projectTagsRepository,
  )

  return new FetchInstitutionProjectsBySlugController(
    fetchInstitutionProjectsBySlugUseCase,
    attachmentsRepository,
    tagsRepository,
  )
}
