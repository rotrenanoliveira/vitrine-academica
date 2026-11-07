import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { RespondProjectInvitationUseCase } from '@/domain/project/application/use-cases/project-member/respond-project-invitation'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuditLogsRepository } from '@/infra/database/repositories/drizzle-audit-logs-repository'
import { DrizzleProjectMembersRepository } from '@/infra/database/repositories/drizzle-project-members-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'
import { RespondProjectInvitationController } from '../../controllers/project/respond-project-invitation.controller'

export function makeRespondProjectInvitationController() {
  const projectsRepository = new DrizzleProjectsRepository(db)
  const projectMembersRepository = new DrizzleProjectMembersRepository(db)
  const auditLogsRepository = new DrizzleAuditLogsRepository(db)
  const registerLogUseCase = new RegisterLogUseCase(auditLogsRepository)
  const respondProjectInvitationUseCase = new RespondProjectInvitationUseCase(
    projectsRepository,
    projectMembersRepository,
    registerLogUseCase,
  )

  return new RespondProjectInvitationController(respondProjectInvitationUseCase)
}