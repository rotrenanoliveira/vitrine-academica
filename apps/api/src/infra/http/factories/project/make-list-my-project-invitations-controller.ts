import { ListMyProjectInvitationsUseCase } from '@/domain/project/application/use-cases/project-member/list-my-project-invitations'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectMembersRepository } from '@/infra/database/repositories/drizzle-project-members-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { ListMyProjectInvitationsController } from '../../controllers/project/list-my-project-invitations.controller'

export function makeListMyProjectInvitationsController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const usersRepository = new DrizzleUsersRepository(db)
  const projectMembersRepository = new DrizzleProjectMembersRepository(db)
  const listMyProjectInvitationsUseCase = new ListMyProjectInvitationsUseCase(
    projectsRepository,
    usersRepository,
    projectMembersRepository,
  )

  return new ListMyProjectInvitationsController(listMyProjectInvitationsUseCase)
}