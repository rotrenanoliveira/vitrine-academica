import type { FastifyReply } from 'fastify'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import { ProjectTagAlreadyExistsError } from '@/domain/project/application/_errors/project-tag-already-exists-error'
import type { RegisterProjectTagUseCase } from '@/domain/project/application/use-cases/project-tag/register-project-tag'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import { ProjectTagPresenter } from '../../presenters/project-tag-presenter'

interface RegisterProjectTagParams {
  projectId: string
}

interface RegisterProjectTagBody {
  tagId: string
}

export class RegisterProjectTagController {
  constructor(private readonly registerProjectTag: RegisterProjectTagUseCase) {}

  async handle({ projectId }: RegisterProjectTagParams, { tagId }: RegisterProjectTagBody, reply: FastifyReply) {
    const result = await this.registerProjectTag.execute({ projectId, tagId })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError || error instanceof TagNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof ProjectTagAlreadyExistsError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(201).send({
      projectTag: ProjectTagPresenter.toHTTP(result.value.projectTag),
    })
  }
}
