import type { FastifyReply } from 'fastify'
import type { ListMyTeacherRatingsUseCase } from '@/domain/project/application/use-cases/teacher-rating/list-my-teacher-ratings'
import { ProjectPresenter } from '../../presenters/project-presenter'
import { ProjectTeacherRatingPresenter } from '../../presenters/project-teacher-rating-presenter'

interface ListMyTeacherRatingsParams {
  teacherId: string
}

export class ListMyTeacherRatingsController {
  constructor(private readonly listMyTeacherRatings: ListMyTeacherRatingsUseCase) {}

  async handle({ teacherId }: ListMyTeacherRatingsParams, reply: FastifyReply) {
    const result = await this.listMyTeacherRatings.execute({ teacherId })

    return reply.status(200).send({
      items: result.value.items.map((item) => ({
        project: ProjectPresenter.toHTTP(item.project),
        rating: ProjectTeacherRatingPresenter.toHTTP(item.rating),
      })),
    })
  }
}
