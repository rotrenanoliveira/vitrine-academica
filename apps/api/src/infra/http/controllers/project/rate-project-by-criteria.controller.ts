import type { FastifyReply } from 'fastify'
import { CannotRateOwnProjectError } from '@/domain/project/application/_errors/cannot-rate-own-project-error'
import { CriterionNotActiveError } from '@/domain/project/application/_errors/criterion-not-active-error'
import { InvalidCriteriaScoresError } from '@/domain/project/application/_errors/invalid-criteria-scores-error'
import { ProjectNotEligibleForRatingError } from '@/domain/project/application/_errors/project-not-eligible-for-rating-error'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import { TeacherRatingNotAllowedError } from '@/domain/project/application/_errors/teacher-rating-not-allowed-error'
import { UserNotActiveError } from '@/domain/project/application/_errors/user-not-active-error'
import type { RateProjectByCriteriaUseCase } from '@/domain/project/application/use-cases/teacher-rating/rate-project-by-criteria'
import { ProjectTeacherRatingPresenter } from '../../presenters/project-teacher-rating-presenter'

interface RateProjectByCriteriaParams {
  projectId: string
  teacherId: string
  sessionId: string
  scores: Array<{ criterionId: string; score: number }>
}

export class RateProjectByCriteriaController {
  constructor(private readonly rateProjectByCriteria: RateProjectByCriteriaUseCase) {}

  async handle({ projectId, teacherId, sessionId, scores }: RateProjectByCriteriaParams, reply: FastifyReply) {
    const result = await this.rateProjectByCriteria.execute({
      projectId,
      teacherId,
      sessionId,
      scores,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      if (error instanceof ProjectNotEligibleForRatingError) {
        return reply.status(400).send({ message: error.message })
      }

      if (
        error instanceof CannotRateOwnProjectError ||
        error instanceof UserNotActiveError ||
        error instanceof TeacherRatingNotAllowedError
      ) {
        return reply.status(403).send({ message: error.message })
      }

      if (error instanceof InvalidCriteriaScoresError || error instanceof CriterionNotActiveError) {
        return reply.status(400).send({ message: error.message })
      }

      throw error
    }

    return reply.status(result.value.created ? 201 : 200).send({
      rating: ProjectTeacherRatingPresenter.toHTTP(result.value.rating),
    })
  }
}
