import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Slug } from '@/core/entities/value-objects/slug'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus, type LogParams } from '@/domain/audit/enterprise/entities/audit-log'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import { Project } from '../../../enterprise/entities/project'
import { ProjectTag } from '../../../enterprise/entities/project-tag'
import { ProjectSlugAlreadyExistsError } from '../../_errors/project-slug-already-exists-error'
import type { ProjectTagsRepository } from '../../repositories/project-tags-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface RegisterProjectUseCaseRequest {
  title: string
  description: string
  slug: string
  authorId: string
  sessionId: string
  tags: string[]
  coverUrl?: string | null
  attachments?: string[]
}

type RegisterProjectUseCaseResponse = Either<ProjectSlugAlreadyExistsError | TagNotFoundError, { project: Project }>

export class RegisterProjectUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectTagsRepository: ProjectTagsRepository,
    private readonly tagsRepository: TagsRepository,
    private readonly registerLog: RegisterLogUseCase,
  ) {}

  async execute({
    title,
    description,
    slug,
    authorId,
    sessionId,
    tags,
    coverUrl,
    attachments,
  }: RegisterProjectUseCaseRequest): Promise<RegisterProjectUseCaseResponse> {
    const normalizedSlug = Slug.createFromText(slug).value

    const slugAlreadyExists = await this.isSlugAlreadyExists(normalizedSlug, authorId, sessionId)

    if (slugAlreadyExists) {
      return left(new ProjectSlugAlreadyExistsError())
    }

    const tagsValidation = await this.validateProjectTags(tags, authorId, sessionId)

    if (tagsValidation.isLeft()) {
      return left(tagsValidation.value)
    }

    const project = Project.create({
      title,
      description,
      slug: normalizedSlug,
      author: new UniqueEntityId(authorId),
      coverUrl: coverUrl ?? null,
      attachments,
      tags,
    })

    await this.projectsRepository.create(project)

    await this.createProjectTags(project.id, tags)

    await this.log({
      actorId: authorId,
      sessionId,
      resourceId: project.id.toString(),
      diff: {
        title: { old: null, new: title },
        description: { old: null, new: description },
        slug: { old: null, new: normalizedSlug },
        authorId: { old: null, new: authorId },
        coverUrl: { old: null, new: coverUrl ?? null },
        attachments: { old: null, new: attachments ?? [] },
        tags: { old: null, new: tags },
      },
      status: AuditLogStatus.SUCCESS,
      text: `Projeto ${project.id.toString()} criado com sucesso`,
    })

    return right({ project })
  }

  private async log({ actorId, resourceId, text, status, diff, sessionId }: LogParams) {
    await this.registerLog.execute({
      actorId,
      sessionId: sessionId ?? null,
      action: AuditLogAction.CREATE,
      resource: 'project',
      resourceId,
      diff: diff ?? null,
      status,
      text,
    })
  }

  private async isSlugAlreadyExists(slug: string, authorId: string, sessionId: string) {
    const projectWithSameSlug = await this.projectsRepository.findBySlug(slug)

    if (projectWithSameSlug) {
      await this.log({
        actorId: authorId,
        sessionId,
        resourceId: slug,
        text: `Slug de projeto já existe: ${slug}`,
        status: AuditLogStatus.FAILURE,
      })

      return true
    }

    return false
  }

  private async validateProjectTags(
    tags: string[],
    authorId: string,
    sessionId: string,
  ): Promise<Either<TagNotFoundError, null>> {
    for (const tagId of tags) {
      const tag = await this.tagsRepository.findById(tagId)

      if (!tag) {
        await this.log({
          actorId: authorId,
          sessionId,
          resourceId: tagId,
          text: `Tag ${tagId} não encontrada ao criar projeto.`,
          status: AuditLogStatus.FAILURE,
        })

        return left(new TagNotFoundError())
      }
    }

    return right(null)
  }

  private async createProjectTags(projectId: UniqueEntityId, tags: string[]) {
    for (const tagId of tags) {
      const projectTag = ProjectTag.create({
        projectId,
        tagId: new UniqueEntityId(tagId),
      })

      await this.projectTagsRepository.create(projectTag)
    }
  }
}
