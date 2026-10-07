import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { Project, ProjectStatus } from '../../../enterprise/entities/project'
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface UpdateProjectUseCaseRequest {
  projectId: string
  authorId: string
  title: string
  description: string
  status?: ProjectStatus
  attachments?: string[]
}

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type UpdateProjectUseCaseResponse = Either<ProjectNotFoundError | NotProjectOwnerError, { project: Project }>

export class UpdateProjectUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.UPDATE,
      resource: 'project',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    projectId,
    authorId,
    title,
    description,
    status,
    attachments,
  }: UpdateProjectUseCaseRequest): Promise<UpdateProjectUseCaseResponse> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Projeto ${projectId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectNotFoundError())
    }

    if (project.author.toString() !== authorId) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Usuário ${authorId} não tem permissão para atualizar o projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotProjectOwnerError())
    }

    const diff: Record<string, { old: unknown; new: unknown }> = {
      title: { old: project.title, new: title },
      description: { old: project.description, new: description },
    }

    project.title = title
    project.description = description

    if (status !== undefined) {
      diff.status = { old: project.status, new: status }
      project.status = status
    }

    if (attachments !== undefined) {
      diff.attachments = { old: project.attachments, new: attachments }
      project.attachments = attachments
    }

    await this.projectsRepository.save(project)

    await this.log({
      actorId: authorId,
      resourceId: projectId,
      text: `Projeto ${projectId} atualizado com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff,
    })

    return right({ project })
  }
}
