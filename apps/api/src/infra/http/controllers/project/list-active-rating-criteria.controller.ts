import type { FastifyReply } from 'fastify'
import type { ListActiveRatingCriteriaUseCase } from '@/domain/project/application/use-cases/teacher-rating/list-active-rating-criteria'
import { RatingCriterionPresenter } from '../../presenters/rating-criterion-presenter'

export class ListActiveRatingCriteriaController {
  constructor(private readonly listActiveRatingCriteria: ListActiveRatingCriteriaUseCase) {}

  async handle(_params: Record<string, never>, reply: FastifyReply) {
    const result = await this.listActiveRatingCriteria.execute()

    return reply.status(200).send({
      criteria: result.value.criteria.map(RatingCriterionPresenter.toHTTP),
    })
  }
}
