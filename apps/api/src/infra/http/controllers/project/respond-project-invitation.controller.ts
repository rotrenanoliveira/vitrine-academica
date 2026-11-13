import type { FastifyReply } from 'fastify'
import { InvalidProjectStatusError } from '@/domain/project/application/_errors/invalid-project-status-error'
import { NotInvitedUserError } from '@/domain/project/application/_errors/not-invited-user-error'
import { ProjectInvitationAlreadyAnsweredError } from '@/domain/project/application/_errors/project-invitation-already-answered-error'
import { ProjectInvitationNotFoundError } from '@/domain/project/application/_errors/project-invitation-not-found-error'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type {
  InvitationAnswer,
  RespondProjectInvitationUseCase,
} from '@/domain/project/application/use-cases/project-member/respond-project-invitation'
import { ProjectMemberPresenter } from '../../presenters/project-member-presenter'

interface RespondProjectInvitationParams {
  invitationId: string
  userId: string
}

interface RespondProjectInvitationBody {
  status: InvitationAnswer
}

export class RespondProjectInvitationController {
  constructor(private readonly respondProjectInvitation: RespondProjectInvitationUseCase) {}

  async handle(
    { invitationId, userId }: RespondProjectInvitationParams,
    { status }: RespondProjectInvitationBody,
    reply: FastifyReply,
  ) {
    const result = await this.respondProjectInvitation.execute({ invitationId, userId, status })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectInvitationNotFoundError || error instanceof ProjectNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof NotInvitedUserError) {
        return reply.status(403).send({
          message: error.message,
        })
      }

      if (error instanceof ProjectInvitationAlreadyAnsweredError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      if (error instanceof InvalidProjectStatusError) {
        return reply.status(400).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(200).send({
      projectMember: ProjectMemberPresenter.toHTTP(result.value.projectMember),
    })
  }
}
