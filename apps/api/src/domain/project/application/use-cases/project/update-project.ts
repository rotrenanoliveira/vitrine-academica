import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { PublicationNotifier } from '@/domain/project/application/notifier/publication-notifier'
import { type Project, ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectMembersRepository } from '../../repositories/project-members-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface UpdateProjectUseCaseRequest {
  projectId: string
  authorId: string
  title: string
  description: string
  status?: ProjectStatus
  coverUrl?: string | null
  attachments?: string[]
}

type UpdateProjectUseCaseResponse = Either<ProjectNotFoundError | NotProjectOwnerError, { project: Project }>

type ApplyUpdatesInput = {
  authorId: string
  projectId: string
  title: string
  description: string
  status?: ProjectStatus
  coverUrl?: string | null
  attachments?: string[]
  isOwner: boolean
}

export class UpdateProjectUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly registerLog: RegisterLogUseCase,
    private readonly projectMembersRepository: ProjectMembersRepository,
    private readonly publicationNotifier?: PublicationNotifier,
  ) {}

  async execute(params: UpdateProjectUseCaseRequest): Promise<UpdateProjectUseCaseResponse> {
    const projectResult = await this.findProjectOrFail(params.projectId, params.authorId)

    if (projectResult.isLeft()) {
      return left(projectResult.value)
    }

    const project = projectResult.value
    const isOwner = project.author.toString() === params.authorId

    const accessResult = await this.validateProjectAccess(project, params.authorId, params.status)

    if (accessResult.isLeft()) {
      return left(accessResult.value)
    }

    const { isPublishable } = await this.saveProject(project, {
      authorId: params.authorId,
      projectId: params.projectId,
      title: params.title,
      description: params.description,
      status: params.status,
      coverUrl: params.coverUrl,
      attachments: params.attachments,
      isOwner,
    })

    if (isPublishable) {
      await this.notifyFollowers(project.id.toString())
    }

    return right({ project })
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.UPDATE,
      resource: 'project',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async isAcceptedMember(projectId: string, userId: string): Promise<boolean> {
    const projectMember = await this.projectMembersRepository.findByProjectAndUser(projectId, userId)

    return projectMember?.status === ProjectMemberStatus.ACCEPTED
  }

  private async notifyFollowers(projectId: string) {
    try {
      await this.publicationNotifier?.execute({ projectId })
    } catch {
      return
    }
  }

  private async findProjectOrFail(projectId: string, authorId: string): Promise<Either<ProjectNotFoundError, Project>> {
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

    return right(project)
  }

  private async validateProjectAccess(
    project: Project,
    authorId: string,
    status?: ProjectStatus,
  ): Promise<Either<NotProjectOwnerError, null>> {
    const projectId = project.id.toString()
    const isOwner = project.author.toString() === authorId

    if (isOwner) {
      return right(null)
    }

    if (!(await this.isAcceptedMember(projectId, authorId))) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Usuário ${authorId} não tem permissão para atualizar o projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotProjectOwnerError())
    }

    if (status !== undefined && status !== project.status) {
      await this.log({
        actorId: authorId,
        resourceId: projectId,
        text: `Coautor ${authorId} tentou mudar o status do projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotProjectOwnerError('Somente o dono do projeto pode alterar o status'))
    }

    return right(null)
  }

  private async saveProject(
    project: Project,
    { authorId, projectId, title, description, status, coverUrl, attachments, isOwner }: ApplyUpdatesInput,
  ): Promise<{ isPublishable: boolean }> {
    const diff: Record<string, { old: unknown; new: unknown }> = {
      title: { old: project.title, new: title },
      description: { old: project.description, new: description },
    }

    project.title = title
    project.description = description

    const isPublishable = isOwner && status === ProjectStatus.PUBLISHED && project.status !== ProjectStatus.PUBLISHED

    if (isOwner && status !== undefined) {
      diff.status = { old: project.status, new: status }
      project.status = status
    }

    if (coverUrl !== undefined) {
      diff.coverUrl = { old: project.coverUrl, new: coverUrl }
      project.coverUrl = coverUrl
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

    return { isPublishable }
  }
}
