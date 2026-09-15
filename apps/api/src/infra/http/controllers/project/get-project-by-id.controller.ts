import type { FastifyReply } from 'fastify'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { GetProjectByIdUseCase } from '@/domain/project/application/use-cases/project/get-project-by-id'
import { ProjectPresenter } from '../../presenters/project-presenter'

interface GetProjectByIdParams {
  projectId: string
  requesterId: string
}

export class GetProjectByIdController {
  constructor(private readonly getProjectById: GetProjectByIdUseCase) {}

  async handle({ projectId, requesterId }: GetProjectByIdParams, reply: FastifyReply) {
    const result = await this.getProjectById.execute({ projectId, requesterId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send({
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
