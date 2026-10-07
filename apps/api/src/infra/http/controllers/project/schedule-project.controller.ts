import type { FastifyReply } from 'fastify'
import { InvalidProjectStatusError } from '@/domain/project/application/_errors/invalid-project-status-error'
import { NotProjectOwnerError } from '@/domain/project/application/_errors/not-project-owner-error'
import { ProjectAlreadyScheduledError } from '@/domain/project/application/_errors/project-already-scheduled-error'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import type { ScheduleProjectUseCase } from '@/domain/project/application/use-cases/scheduled-project/schedule-project'
import { ProjectScheduledPresenter } from '../../presenters/project-scheduled-presenter'

interface ScheduleProjectParams {
  projectId: string
  authorId: string
}

interface ScheduleProjectBody {
  publishedIn: Date
}

export class ScheduleProjectController {
  constructor(private readonly scheduleProject: ScheduleProjectUseCase) {}

  async handle(
    { projectId, authorId }: ScheduleProjectParams,
    { publishedIn }: ScheduleProjectBody,
    reply: FastifyReply,
  ) {
    const result = await this.scheduleProject.execute({ projectId, authorId, publishedIn })

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

      if (error instanceof ProjectAlreadyScheduledError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      if (error instanceof InvalidProjectStatusError) {
        return reply.status(400).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(201).send({
      projectScheduled: ProjectScheduledPresenter.toHTTP(result.value.projectScheduled),
    })
  }
}
