import type { FastifyReply } from 'fastify'
import { CallSkillsRequiredError } from '@/domain/call/application/_errors/call-skills-required-error'
import { InvalidCallDeadlineError } from '@/domain/call/application/_errors/invalid-call-deadline-error'
import type { RegisterCallUseCase } from '@/domain/call/application/use-cases/call/register-call'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import { CallPresenter } from '../../presenters/call-presenter'

interface RegisterCallParams {
  authorId: string
}

interface RegisterCallBody {
  title: string
  description: string
  applicationDeadline: string
  skills: { tagId: string; description?: string | null }[]
}

export class RegisterCallController {
  constructor(private readonly registerCall: RegisterCallUseCase) {}

  async handle(
    { authorId }: RegisterCallParams,
    { title, description, applicationDeadline, skills }: RegisterCallBody,
    reply: FastifyReply,
  ) {
    const result = await this.registerCall.execute({
      authorId,
      title,
      description,
      applicationDeadline: new Date(applicationDeadline),
      skills,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof TagNotFoundError) {
        return reply.status(404).send({
          message: error.message,
        })
      }

      if (error instanceof CallSkillsRequiredError || error instanceof InvalidCallDeadlineError) {
        return reply.status(400).send({
          message: error.message,
        })
      }

      throw error
    }

    return reply.status(201).send({
      call: CallPresenter.toHTTPWithSkills(result.value),
    })
  }
}
