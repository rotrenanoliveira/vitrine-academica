import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { NotProjectOwnerError } from '@/domain/project/application/_errors/not-project-owner-error'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import { ProjectTagAlreadyExistsError } from '@/domain/project/application/_errors/project-tag-already-exists-error'
import type { ProjectTagsRepository } from '@/domain/project/application/repositories/project-tags-repository'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import type { Project } from '@/domain/project/enterprise/entities/project'
import { ProjectTag } from '@/domain/project/enterprise/entities/project-tag'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import type { Tag } from '@/domain/tag/enterprise/entities/tag'

interface RegisterProjectTagUseCaseRequest {
  projectId: string
  actorId: string
  tagId: string
}

type RegisterProjectTagUseCaseResponse = Either<
  ProjectNotFoundError | NotProjectOwnerError | TagNotFoundError | ProjectTagAlreadyExistsError,
  { projectTag: ProjectTag }
>

export class RegisterProjectTagUseCase {
  constructor(
    private readonly projectTagsRepository: ProjectTagsRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly tagsRepository: TagsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    projectId,
    actorId,
    tagId,
  }: RegisterProjectTagUseCaseRequest): Promise<RegisterProjectTagUseCaseResponse> {
    const projectResult = await this.findProjectOrFail(projectId, actorId)

    if (projectResult.isLeft()) {
      return left(projectResult.value)
    }

    const project = projectResult.value

    const ownerResult = await this.isProjectOwner(project, actorId)

    if (ownerResult.isLeft()) {
      return left(ownerResult.value)
    }

    const tagResult = await this.findTagOrFail(tagId, actorId)

    if (tagResult.isLeft()) {
      return left(tagResult.value)
    }

    const existsResult = await this.isProjectTagAlreadyExists(projectId, tagId, actorId)

    if (existsResult.isLeft()) {
      return left(existsResult.value)
    }

    // const projectTag = ProjectTag.create({
    //   projectId: new UniqueEntityId(projectId),
    //   tagId: new UniqueEntityId(tagId),
    // })

    // await this.projectTagsRepository.create(projectTag)

    // const { previousTags } = await this.updateProjectTags(project, tagId)

    // await this.log({
    //   actorId,
    //   resourceId: projectTag.id.toString(),
    //   text: `Tag ${tagId} associada ao projeto ${projectId} com sucesso.`,
    //   status: AuditLogStatus.SUCCESS,
    //   diff: { tags: { old: previousTags, new: project.tags } },
    // })

    const { projectTag } = await this.createProjectTag(project, tagId, actorId)

    return right({ projectTag })
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
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
        text: `Usuário ${actorId} não tem permissão para vincular tags ao projeto ${project.id.toString()}.`,
        status: AuditLogStatus.FAILURE,
      })

      return left(new NotProjectOwnerError())
    }

    return right(null)
  }

  private async findTagOrFail(tagId: string, actorId: string): Promise<Either<TagNotFoundError, Tag>> {
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

    return right(tag)
  }

  private async isProjectTagAlreadyExists(
    projectId: string,
    tagId: string,
    actorId: string,
  ): Promise<Either<ProjectTagAlreadyExistsError, null>> {
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

    return right(null)
  }

  private async createProjectTag(
    project: Project,
    tagId: string,
    actorId: string,
  ): Promise<{ projectTag: ProjectTag }> {
    const projectTag = ProjectTag.create({
      projectId: project.id,
      tagId: new UniqueEntityId(tagId),
    })

    await this.projectTagsRepository.create(projectTag)

    const previousTags = project.tags
    const nextTags = previousTags.includes(tagId) ? previousTags : [...previousTags, tagId]
    project.tags = nextTags

    await this.projectsRepository.save(project)

    await this.log({
      actorId,
      resourceId: projectTag.id.toString(),
      text: `Tag ${tagId} associada ao projeto ${project.id.toString()} com sucesso.`,
      status: AuditLogStatus.SUCCESS,
      diff: { tags: { old: previousTags, new: project.tags } },
    })

    return { projectTag }
  }
}
