import type { FastifyReply } from 'fastify'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { ListProjectTeacherRatingsUseCase } from '@/domain/project/application/use-cases/teacher-rating/list-project-teacher-ratings'
import { ProjectTeacherRatingPresenter } from '../../presenters/project-teacher-rating-presenter'
import { RatingCriterionPresenter } from '../../presenters/rating-criterion-presenter'

interface ListProjectTeacherRatingsParams {
  projectId: string
}

export class ListProjectTeacherRatingsController {
  constructor(private readonly listProjectTeacherRatings: ListProjectTeacherRatingsUseCase) {}

  async handle({ projectId }: ListProjectTeacherRatingsParams, reply: FastifyReply) {
    const result = await this.listProjectTeacherRatings.execute({ projectId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      throw error
    }

    return reply.status(200).send({
      criteria: result.value.criteria.map(RatingCriterionPresenter.toHTTP),
      items: result.value.items.map((item) => ({
        teacher: item.teacher,
        rating: ProjectTeacherRatingPresenter.toHTTP(item.teacherRating),
      })),
    })
  }
}
