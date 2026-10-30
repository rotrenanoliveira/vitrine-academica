import type { FastifyReply } from 'fastify'
import { NotProjectOwnerError } from '@/domain/project/application/_errors/not-project-owner-error'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import { ProjectTagNotFoundError } from '@/domain/project/application/_errors/project-tag-not-found-error'
import type { RemoveProjectTagUseCase } from '@/domain/project/application/use-cases/project-tag/remove-project-tag'
import { ProjectPresenter } from '../../presenters/project-presenter'

interface RemoveProjectTagParams {
  actorId: string
  projectId: string
  tagId: string
}

export class RemoveProjectTagController {
  constructor(private readonly removeProjectTag: RemoveProjectTagUseCase) {}

  async handle({ actorId, projectId, tagId }: RemoveProjectTagParams, reply: FastifyReply) {
    const result = await this.removeProjectTag.execute({ actorId, projectId, tagId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError || error instanceof ProjectTagNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof NotProjectOwnerError) {
        return reply.status(403).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(200).send({
      project: ProjectPresenter.toHTTP(result.value.project),
    })
  }
}
