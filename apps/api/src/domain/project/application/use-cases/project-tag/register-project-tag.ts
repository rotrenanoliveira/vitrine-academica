import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import { ProjectTagAlreadyExistsError } from '@/domain/project/application/_errors/project-tag-already-exists-error'
import type { ProjectTagsRepository } from '@/domain/project/application/repositories/project-tags-repository'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import { ProjectTag } from '@/domain/project/enterprise/entities/project-tag'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'

interface RegisterProjectTagUseCaseRequest {
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

type RegisterProjectTagUseCaseResponse = Either<
  ProjectNotFoundError | TagNotFoundError | ProjectTagAlreadyExistsError,
  { projectTag: ProjectTag }
>

export class RegisterProjectTagUseCase {
  constructor(
    private readonly projectTagsRepository: ProjectTagsRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly tagsRepository: TagsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  private async log({ actorId, resourceId, text, status, diff }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: null,
      action: AuditLogAction.CREATE,
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
  }: RegisterProjectTagUseCaseRequest): Promise<RegisterProjectTagUseCaseResponse> {
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

    const tag = await this.tagsRepository.findById(tagId)

    if (!tag) {
      await this.log({
        actorId,
        resourceId: tagId,
        text: `Tag ${tagId} não encontrado.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new TagNotFoundError())
    }

    const projectTagAlreadyExists = await this.projectTagsRepository.findByProjectIdAndTagId(projectId, tagId)

    if (projectTagAlreadyExists) {
      await this.log({
        actorId,
        resourceId: projectTagAlreadyExists.id.toString(),
        text: `Tag ${tagId} já está associada ao projeto ${projectId}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new ProjectTagAlreadyExistsError())
    }

    const projectTag = ProjectTag.create({
      projectId: new UniqueEntityId(projectId),
      tagId: new UniqueEntityId(tagId),
    })

    await this.projectTagsRepository.create(projectTag)

    const nextTags = project.tags.includes(tagId) ? project.tags : [...project.tags, tagId]
    project.tags = nextTags
    await this.projectsRepository.save(project)

    await this.log({
      actorId,
      resourceId: projectTag.id.toString(),
      text: `Tag ${tagId} associada ao projeto ${projectId} com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff: { projectId: { old: project.tags, new: nextTags } },
    })

    return right({ projectTag })
  }
}
