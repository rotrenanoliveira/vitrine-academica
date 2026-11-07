import type { FastifyReply } from 'fastify'
import { CallNotFoundError } from '@/domain/call/application/_errors/call-not-found-error'
import { CallSkillsRequiredError } from '@/domain/call/application/_errors/call-skills-required-error'
import { InvalidCallDeadlineError } from '@/domain/call/application/_errors/invalid-call-deadline-error'
import { InvalidCallStatusError } from '@/domain/call/application/_errors/invalid-call-status-error'
import { NotCallOwnerError } from '@/domain/call/application/_errors/not-call-owner-error'
import type { UpdateCallUseCase } from '@/domain/call/application/use-cases/call/update-call'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import { CallPresenter } from '../../presenters/call-presenter'

interface UpdateCallParams {
  callId: string
  authorId: string
}

interface UpdateCallBody {
  title: string
  description: string
  applicationDeadline: string
  skills?: { tagId: string; description?: string | null }[]
}

export class UpdateCallController {
  constructor(private readonly updateCall: UpdateCallUseCase) {}

  async handle(
    { callId, authorId }: UpdateCallParams,
    { title, description, applicationDeadline, skills }: UpdateCallBody,
    reply: FastifyReply,
  ) {
    const result = await this.updateCall.execute({
      callId,
      authorId,
      title,
      description,
      applicationDeadline: new Date(applicationDeadline),
      skills,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof CallNotFoundError || error instanceof TagNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof NotCallOwnerError) {
        return reply.status(403).send({
          message: error.message,
        })
      }

      if (error instanceof InvalidCallStatusError) {
        return reply.status(409).send({
          message: error.message,
        })
      }

      if (error instanceof InvalidCallDeadlineError || error instanceof CallSkillsRequiredError) {
        return reply.status(400).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(200).send({
      call: CallPresenter.toHTTPWithSkills(result.value),
    })
  }
}
