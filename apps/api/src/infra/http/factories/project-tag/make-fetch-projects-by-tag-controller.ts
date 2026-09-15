import { FetchProjectsByTagUseCase } from '@/domain/project/application/use-cases/project-tag/fetch-projects-by-tag'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectTagsRepository } from '@/infra/database/repositories/drizzle-project-tags-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleTagsRepository } from '@/infra/database/repositories/drizzle-tags-repository'
import { FetchProjectsByTagController } from '../../controllers/project-tag/fetch-projects-by-tag.controller'

export function makeFetchProjectsByTagController() {
  const projectTagsRepository = new DrizzleProjectTagsRepository(db)
  const projectsRepository = new DrizzleProjectsRepository(db)
  const tagsRepository = new DrizzleTagsRepository(db)
  const fetchProjectsByTagUseCase = new FetchProjectsByTagUseCase(
    projectTagsRepository,
    projectsRepository,
    tagsRepository,
  )

  return new FetchProjectsByTagController(fetchProjectsByTagUseCase)
}
