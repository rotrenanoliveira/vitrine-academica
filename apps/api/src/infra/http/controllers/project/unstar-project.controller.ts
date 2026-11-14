import type { FastifyReply } from 'fastify'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import { StarNotFoundError } from '@/domain/project/application/_errors/star-not-found-error'
import type { UnstarProjectUseCase } from '@/domain/project/application/use-cases/project-star/unstar-project'

interface UnstarProjectParams {
  projectId: string
  userId: string
  sessionId: string
}

export class UnstarProjectController {
  constructor(private readonly unstarProject: UnstarProjectUseCase) {}

  async handle({ projectId, userId, sessionId }: UnstarProjectParams, reply: FastifyReply) {
    const result = await this.unstarProject.execute({ projectId, userId, sessionId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError || error instanceof StarNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      throw error
    }

    return reply.status(204).send()
  }
}
