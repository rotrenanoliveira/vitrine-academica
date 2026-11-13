import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Slug } from '@/core/entities/value-objects/slug'
import type { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { AuditLogAction, AuditLogStatus } from '@/domain/audit/enterprise/entities/audit-log'
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
    const projectWithSameSlug = await this.projectsRepository.findBySlug(normalizedSlug)

    if (projectWithSameSlug) {
      await this.registerLog.execute({
        actorId: authorId,
        sessionId,
        action: AuditLogAction.CREATE,
        resource: 'project',
        resourceId: projectWithSameSlug.id.toString(),
        diff: null,
        status: AuditLogStatus.FAILURE,
        text: `Slug de projeto já existe: ${normalizedSlug}`,
      })

      return left(new ProjectSlugAlreadyExistsError())
    }

    for (const tagId of tags) {
      const tag = await this.tagsRepository.findById(tagId)

      if (!tag) {
        await this.registerLog.execute({
          actorId: authorId,
          sessionId,
          action: AuditLogAction.CREATE,
          resource: 'project',
          resourceId: tagId,
          diff: null,
          status: AuditLogStatus.FAILURE,
          text: `Tag ${tagId} não encontrada ao criar projeto.`,
        })

        return left(new TagNotFoundError())
      }
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

    for (const tagId of tags) {
      const projectTag = ProjectTag.create({
        projectId: project.id,
        tagId: new UniqueEntityId(tagId),
      })

      await this.projectTagsRepository.create(projectTag)
    }

    await this.registerLog.execute({
      actorId: authorId,
      sessionId,
      action: AuditLogAction.CREATE,
      resource: 'project',
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
    })

    return right({ project })
  }
}
