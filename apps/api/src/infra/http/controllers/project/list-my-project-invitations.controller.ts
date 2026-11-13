import type { FastifyReply } from 'fastify'
import type { ListMyProjectInvitationsUseCase } from '@/domain/project/application/use-cases/project-member/list-my-project-invitations'
import type { ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import { ProjectInvitationPresenter } from '../../presenters/project-invitation-presenter'

interface ListMyProjectInvitationsParams {
  userId: string
}

interface ListMyProjectInvitationsQuery {
  status?: ProjectMemberStatus
}

export class ListMyProjectInvitationsController {
  constructor(private readonly listMyProjectInvitations: ListMyProjectInvitationsUseCase) {}

  async handle(
    { userId }: ListMyProjectInvitationsParams,
    { status }: ListMyProjectInvitationsQuery,
    reply: FastifyReply,
  ) {
    const result = await this.listMyProjectInvitations.execute({ userId, status })

    if (result.isLeft()) {
      throw result.value
    }

    return reply.status(200).send({
      invitations: result.value.invitations.map(ProjectInvitationPresenter.toHTTP),
    })
  }
}
