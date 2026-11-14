import type { FastifyReply } from 'fastify'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { GetMyTeacherRatingOnProjectUseCase } from '@/domain/project/application/use-cases/teacher-rating/get-my-teacher-rating-on-project'
import { ProjectTeacherRatingPresenter } from '../../presenters/project-teacher-rating-presenter'

interface GetMyTeacherRatingOnProjectParams {
  projectId: string
  teacherId: string
}

export class GetMyTeacherRatingOnProjectController {
  constructor(private readonly getMyTeacherRatingOnProject: GetMyTeacherRatingOnProjectUseCase) {}

  async handle({ projectId, teacherId }: GetMyTeacherRatingOnProjectParams, reply: FastifyReply) {
    const result = await this.getMyTeacherRatingOnProject.execute({ projectId, teacherId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }

      throw error
    }

    return reply.status(200).send({
      teacherRating: result.value.rating ? ProjectTeacherRatingPresenter.toHTTP(result.value.rating) : null,
    })
  }
}
