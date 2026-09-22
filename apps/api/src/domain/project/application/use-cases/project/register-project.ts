import { type Either, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { Project } from '../../../enterprise/entities/project'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface RegisterProjectUseCaseRequest {
  title: string
  description: string
  authorId: string
  sessionId: string
  attachments?: string[]
  tags?: string[]
}

type RegisterProjectUseCaseResponse = Either<never, { project: Project }>

export class RegisterProjectUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    title,
    description,
    authorId,
    sessionId,
    attachments,
    tags,
  }: RegisterProjectUseCaseRequest): Promise<RegisterProjectUseCaseResponse> {
    const project = Project.create({
      title,
      description,
      author: new UniqueEntityId(authorId),
      attachments,
      tags,
    })

    await this.projectsRepository.create(project)

    await this.registerLog.execute({
      actorId: authorId,
      sessionId,
      action: AuditLogAction.CREATE,
      resource: 'project',
      resourceId: project.id.toString(),
      diff: {
        title: { old: null, new: title },
        description: { old: null, new: description },
        authorId: { old: null, new: authorId },
        attachments: { old: null, new: attachments ?? [] },
        tags: { old: null, new: tags ?? [] },
      },
      status: AuditLogStatus.SUCCESS,
    })

    return right({ project })
  }
}
