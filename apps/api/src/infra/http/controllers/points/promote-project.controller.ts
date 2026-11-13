import type { FastifyReply } from 'fastify'
import { CannotPromoteOwnProjectError } from '@/domain/points/application/_errors/cannot-promote-own-project-error'
import { InsufficientPointsError } from '@/domain/points/application/_errors/insufficient-points-error'
import { ProjectAlreadyPromotedByUserError } from '@/domain/points/application/_errors/project-already-promoted-by-user-error'
import { ProjectNotEligibleForPromotionError } from '@/domain/points/application/_errors/project-not-eligible-for-promotion-error'
import type { PromoteProjectUseCase } from '@/domain/points/application/use-cases/promotion/promote-project'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import { UserNotActiveError } from '@/domain/project/application/_errors/user-not-active-error'
import { PromotionPresenter } from '../../presenters/promotion-presenter'

interface PromoteProjectParams {
  projectId: string
  userId: string
  sessionId: string
}

export class PromoteProjectController {
  constructor(private readonly promoteProject: PromoteProjectUseCase) {}

  async handle({ projectId, userId, sessionId }: PromoteProjectParams, reply: FastifyReply) {
    const result = await this.promoteProject.execute({ projectId, userId, sessionId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof ProjectNotEligibleForPromotionError) {
        return reply.status(400).send({ message: error.message })
      }

      if (error instanceof CannotPromoteOwnProjectError) {
        return reply.status(403).send({ message: error.message })
      }

      if (error instanceof UserNotActiveError) {
        return reply.status(403).send({ message: error.message })
      }

      if (error instanceof InsufficientPointsError) {
        return reply.status(409).send({ message: error.message })
      }

      if (error instanceof ProjectAlreadyPromotedByUserError) {
        return reply.status(409).send({ message: error.message })
      }

      throw error
    }

    return reply.status(201).send({
      promotion: PromotionPresenter.toHTTP(result.value.promotion),
    })
  }
}
