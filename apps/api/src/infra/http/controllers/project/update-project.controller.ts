import type { FastifyReply } from 'fastify'
import { NotProjectOwnerError } from '@/domain/project/application/_errors/not-project-owner-error'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { UpdateProjectUseCase } from '@/domain/project/application/use-cases/project/update-project'
import type { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { ProjectPresenter } from '../../presenters/project-presenter'

interface UpdateProjectParams {
  projectId: string
  authorId: string
}

interface UpdateProjectBody {
  title: string
  description: string
  status?: ProjectStatus
  attachments?: string[]
}

export class UpdateProjectController {
  constructor(private readonly updateProject: UpdateProjectUseCase) {}

  async handle(
    { projectId, authorId }: UpdateProjectParams,
    { title, description, status, attachments }: UpdateProjectBody,
    reply: FastifyReply,
  ) {
    const result = await this.updateProject.execute({
      projectId,
      authorId,
      title,
      description,
      status,
      attachments,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof NotProjectOwnerError) {
        return reply.status(403).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(200).send({
      project: ProjectPresenter.toHTTP(result.value.project),
    })
  }
}
