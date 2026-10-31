import type { FastifyReply } from 'fastify'
import { CannotRateOwnProjectError } from '@/domain/project/application/_errors/cannot-rate-own-project-error'
import { ProjectNotEligibleForRatingError } from '@/domain/project/application/_errors/project-not-eligible-for-rating-error'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import { UserNotActiveError } from '@/domain/project/application/_errors/user-not-active-error'
import type { StarProjectUseCase } from '@/domain/project/application/use-cases/project-star/star-project'
import { ProjectStarPresenter } from '../../presenters/project-star-presenter'

interface StarProjectParams {
  projectId: string
  userId: string
  sessionId: string
}

export class StarProjectController {
  constructor(private readonly starProject: StarProjectUseCase) {}

  async handle({ projectId, userId, sessionId }: StarProjectParams, reply: FastifyReply) {
    const result = await this.starProject.execute({ projectId, userId, sessionId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof ProjectNotEligibleForRatingError) {
        return reply.status(400).send({ message: error.message })
      }

      if (error instanceof CannotRateOwnProjectError) {
        return reply.status(403).send({ message: error.message })
      }

      if (error instanceof UserNotActiveError) {
        return reply.status(403).send({ message: error.message })
      }

      throw error
    }

    return reply.status(201).send({
      projectStar: ProjectStarPresenter.toHTTP(result.value.projectStar),
    })
  }
}
