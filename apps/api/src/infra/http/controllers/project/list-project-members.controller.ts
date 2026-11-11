import type { FastifyReply } from 'fastify'
import type { ListProjectMembersUseCase } from '@/domain/project/application/use-cases/project-member/list-project-members'
import { ProjectMemberListItemPresenter } from '../../presenters/project-member-list-item-presenter'

interface ListProjectMembersParams {
  projectId: string
  requesterId: string
}

export class ListProjectMembersController {
  constructor(private readonly listProjectMembers: ListProjectMembersUseCase) {}

  async handle({ projectId, requesterId }: ListProjectMembersParams, reply: FastifyReply) {
    const result = await this.listProjectMembers.execute({ projectId, requesterId })

    if (result.isLeft()) {
      return reply.status(404).send({
        message: result.value.message,
      })
    }

    return reply.status(200).send({
      members: result.value.members.map(ProjectMemberListItemPresenter.toHTTP),
    })
  }
}
