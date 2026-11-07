import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { InviteProjectMemberUseCase } from '@/domain/project/application/use-cases/project-member/invite-project-member'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleProjectMembersRepository } from '@/infra/database/repositories/drizzle-project-members-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { DrizzleUsersRepository } from '@/infra/database/repositories/drizzle-users-repository'
import { InviteProjectMemberController } from '../../controllers/project/invite-project-member.controller'

export function makeInviteProjectMemberController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const usersRepository = new DrizzleUsersRepository(db)
  const projectMembersRepository = new DrizzleProjectMembersRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const inviteProjectMemberUseCase = new InviteProjectMemberUseCase(
    projectsRepository,
    usersRepository,
    projectMembersRepository,
    registerLogUseCase,
  )

  return new InviteProjectMemberController(inviteProjectMemberUseCase)
}
