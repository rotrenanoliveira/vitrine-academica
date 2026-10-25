import type { FastifyReply } from 'fastify'
import { InvalidProjectStatusError } from '@/domain/project/application/_errors/invalid-project-status-error'
import { NotProjectOwnerError } from '@/domain/project/application/_errors/not-project-owner-error'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { PublishProjectUseCase } from '@/domain/project/application/use-cases/project/publish-project'
import { ProjectPresenter } from '../../presenters/project-presenter'

interface PublishProjectParams {
  projectId: string
  authorId: string
}

export class PublishProjectController {
  constructor(private readonly publishProject: PublishProjectUseCase) {}

  async handle({ projectId, authorId }: PublishProjectParams, reply: FastifyReply) {
    const result = await this.publishProject.execute({ projectId, authorId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof NotProjectOwnerError) {
        return reply.status(403).send({ message: error.message })
      }

      if (error instanceof InvalidProjectStatusError) {
        return reply.status(400).send({ message: error.message })
      }

      throw error
    }

    return reply.status(200).send({ project: ProjectPresenter.toHTTP(result.value.project) })
  }
}