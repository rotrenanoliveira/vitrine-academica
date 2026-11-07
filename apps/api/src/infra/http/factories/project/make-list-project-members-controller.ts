import { ListProjectMembersUseCase } from '@/domain/project/application/use-cases/project-member/list-project-members'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectMembersRepository } from '@/infra/database/repositories/drizzle-project-members-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { ListProjectMembersController } from '../../controllers/project/list-project-members.controller'

export function makeListProjectMembersController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const usersRepository = new DrizzleUsersRepository(db)
  const projectMembersRepository = new DrizzleProjectMembersRepository(db)
  const listProjectMembersUseCase = new ListProjectMembersUseCase(
    projectsRepository,
    usersRepository,
    projectMembersRepository,
  )

  return new ListProjectMembersController(listProjectMembersUseCase)
}
