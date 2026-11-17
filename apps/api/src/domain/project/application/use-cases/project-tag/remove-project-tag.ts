import { type Either, left, right } from '@/core/either'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import type { Project } from '@/domain/project/enterprise/entities/project'
import type { ProjectTag } from '@/domain/project/enterprise/entities/project-tag'
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

  async execute({
    projectId,
    actorId,
    tagId,
  }: RemoveProjectTagUseCaseRequest): Promise<RemoveProjectTagUseCaseResponse> {
    const projectResult = await this.findProjectOrFail(projectId, actorId)

    if (projectResult.isLeft()) {
      return left(projectResult.value)
    }

    const project = projectResult.value

    const ownerResult = await this.isProjectOwner(project, actorId)

    if (ownerResult.isLeft()) {
      return left(ownerResult.value)
    }

    const associationResult = await this.findProjectTagOrFail(project, tagId, actorId)

    if (associationResult.isLeft()) {
      return left(associationResult.value)
    }

    const projectTag = associationResult.value

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

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.DELETE,
      resource: 'project.tag',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async findProjectOrFail(projectId: string, actorId: string): Promise<Either<ProjectNotFoundError, Project>> {
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

    return right(project)
  }

  private async isProjectOwner(project: Project, actorId: string): Promise<Either<NotProjectOwnerError, null>> {
    if (project.author.toString() !== actorId) {
      await this.log({
        actorId,
        resourceId: project.id.toString(),
        text: `Usuário ${actorId} não tem permissão para remover tags do projeto ${project.id.toString()}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotProjectOwnerError())
    }

    return right(null)
  }

  private async findProjectTagOrFail(
    project: Project,
    tagId: string,
    actorId: string,
  ): Promise<Either<ProjectTagNotFoundError, ProjectTag | null>> {
    const projectId = project.id.toString()
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

    return right(projectTag)
  }
}
