import type { FastifyReply } from 'fastify'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import { UserUnavailableError } from '@/domain/identity/application/_errors/user-unavailable-error'
import { InvalidProjectStatusError } from '@/domain/project/application/_errors/invalid-project-status-error'
import { NotProjectOwnerError } from '@/domain/project/application/_errors/not-project-owner-error'
import { CannotInviteProjectOwnerError } from '@/domain/project/application/_errors/cannot-invite-project-owner-error'
import { ProjectMemberAlreadyInvitedError } from '@/domain/project/application/_errors/project-member-already-invited-error'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { InviteProjectMemberUseCase } from '@/domain/project/application/use-cases/project-member/invite-project-member'
import { ProjectMemberPresenter } from '../../presenters/project-member-presenter'

interface InviteProjectMemberParams {
  projectId: string
  authorId: string
}

interface InviteProjectMemberBody {
  email: string
}

export class InviteProjectMemberController {
  constructor(private readonly inviteProjectMember: InviteProjectMemberUseCase) {}

  async handle(
    { projectId, authorId }: InviteProjectMemberParams,
    { email }: InviteProjectMemberBody,
    reply: FastifyReply,
  ) {
    const result = await this.inviteProjectMember.execute({ projectId, authorId, email })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError || error instanceof UserNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof NotProjectOwnerError) {
        return reply.status(403).send({
          message: error.message,
        })
      }

      if (error instanceof ProjectMemberAlreadyInvitedError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      if (
        error instanceof InvalidProjectStatusError ||
        error instanceof UserUnavailableError ||
        error instanceof CannotInviteProjectOwnerError
      ) {
        return reply.status(400).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(201).send({
      projectMember: ProjectMemberPresenter.toHTTP(result.value.projectMember),
    })
  }
}
