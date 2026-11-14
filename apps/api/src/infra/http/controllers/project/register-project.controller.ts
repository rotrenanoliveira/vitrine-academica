import type { FastifyReply } from 'fastify'
import type { RegisterProjectUseCase } from '@/domain/project/application/use-cases/project/register-project'
import { ProjectPresenter } from '../../presenters/project-presenter'

interface RegisterProjectBody {
  title: string
  description: string
  slug: string
  authorId: string
  sessionId: string
  tags: string[]
  coverUrl?: string | null
  attachments?: string[]
}

export class RegisterProjectController {
  constructor(private readonly registerProject: RegisterProjectUseCase) {}

  async handle(
    { title, description, slug, authorId, sessionId, tags, coverUrl, attachments }: RegisterProjectBody,
    reply: FastifyReply,
  ) {
    const result = await this.registerProject.execute({
      title,
      description,
      slug,
      authorId,
      sessionId,
      tags,
      coverUrl,
      attachments,
    })

    if (result.isLeft()) {
      return reply.status(400).send({
        message: result.value.message,
      })
    }

    return reply.status(201).send({
      project: ProjectPresenter.toHTTP(result.value.project),
    })
  }
}
