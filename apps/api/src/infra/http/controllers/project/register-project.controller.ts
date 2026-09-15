import type { FastifyReply } from 'fastify'
import type { RegisterProjectUseCase } from '@/domain/project/application/use-cases/project/register-project'
import { ProjectPresenter } from '../../presenters/project-presenter'

interface RegisterProjectBody {
  title: string
  description: string
  authorId: string
  attachments?: string[]
  tags?: string[]
}

export class RegisterProjectController {
  constructor(private readonly registerProject: RegisterProjectUseCase) {}

  async handle({ title, description, authorId, attachments, tags }: RegisterProjectBody, reply: FastifyReply) {
    const result = await this.registerProject.execute({
      title,
      description,
      authorId,
      attachments,
      tags,
    })

    return reply.status(201).send({
      project: ProjectPresenter.toHTTP(result.value.project),
    })
  }
}
