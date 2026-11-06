import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import type { Project } from '@/domain/project/enterprise/entities/project'
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { ProjectTagNotFoundError } from '../../_errors/project-tag-not-found-error'
import type { ProjectTagsRepository } from '../../repositories/project-tags-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface RemoveProjectTagUseCaseRequest {
  projectId: string
  actorId: string
  tagId: string
}

type LogParams = {
  actorId: string
  resourceId: string
  text: string
  status: AuditLogStatus
  diff?: Record<string, { old: unknown; new: unknown }> | null
}

type RemoveProjectTagUseCaseResponse = Either<
  ProjectNotFoundError | NotProjectOwnerError | ProjectTagNotFoundError,
  { project: Project }
>

export class RemoveProjectTagUseCase {
  constructor(
    private readonly projectTagsRepository: ProjectTagsRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.DELETE,
      resource: 'project.tag',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  async execute({
    projectId,
    actorId,
    tagId,
  }: RemoveProjectTagUseCaseRequest): Promise<RemoveProjectTagUseCaseResponse> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      await this.log({
        actorId,
        resourceId: projectId,
        text: `Projeto ${projectId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectNotFoundError())
    }

    if (project.author.toString() !== actorId) {
      await this.log({
        actorId,
        resourceId: projectId,
        text: `Usuário ${actorId} não tem permissão para remover tags do projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotProjectOwnerError())
    }

    const projectTag = await this.projectTagsRepository.findByProjectIdAndTagId(projectId, tagId)
    const isListedInProject = project.tags.includes(tagId)

    if (!projectTag && !isListedInProject) {
      await this.log({
        actorId,
        resourceId: projectId,
        text: `Tag ${tagId} não está associada ao projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectTagNotFoundError())
    }

    if (projectTag) {
      await this.projectTagsRepository.delete(projectTag)
    }

    const previousTags = project.tags
    const nextTags = previousTags.filter((id) => id !== tagId)
    project.tags = nextTags
    await this.projectsRepository.save(project)

    await this.log({
      actorId,
      resourceId: projectTag ? projectTag.id.toString() : projectId,
      text: `Tag ${tagId} removida do projeto ${projectId} com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff: { tags: { old: previousTags, new: nextTags } },
    })

    return right({ project })
  }
}
