import { GetFeaturedProjectIdsUseCase } from '@/domain/points/application/use-cases/promotion/get-featured-project-ids'
import { GetProjectByIdUseCase } from '@/domain/project/application/use-cases/project/get-project-by-id'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectMembersRepository } from '@/infra/database/repositories/drizzle-project-members-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzlePromotionsRepository } from '@/infra/database/repositories/drizzle-promotions-repository'
import { GetProjectByIdController } from '../../controllers/project/get-project-by-id.controller'

export function makeGetProjectByIdController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectMembersRepository = new DrizzleProjectMembersRepository(db)
  const getProjectByIdUseCase = new GetProjectByIdUseCase(projectsRepository, projectMembersRepository)
  const getFeaturedProjectIdsUseCase = new GetFeaturedProjectIdsUseCase(new DrizzlePromotionsRepository(db))

  return new GetProjectByIdController(getProjectByIdUseCase, getFeaturedProjectIdsUseCase)
}
