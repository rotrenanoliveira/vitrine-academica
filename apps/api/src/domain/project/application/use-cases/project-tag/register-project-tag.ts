import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectNotFoundError } from '@/domain/project/application/_errors/project-not-found-error'
import { ProjectTagAlreadyExistsError } from '@/domain/project/application/_errors/project-tag-already-exists-error'
import type { ProjectTagsRepository } from '@/domain/project/application/repositories/project-tags-repository'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import { ProjectTag } from '@/domain/project/enterprise/entities/project-tag'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'

interface RegisterProjectTagUseCaseRequest {
  projectId: string
  tagId: string
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
  ) {}

  async execute({ projectId, tagId }: RegisterProjectTagUseCaseRequest): Promise<RegisterProjectTagUseCaseResponse> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      return left(new ProjectNotFoundError())
    }

    const tag = await this.tagsRepository.findById(tagId)

    if (!tag) {
      return left(new TagNotFoundError())
    }

    const projectTagAlreadyExists = await this.projectTagsRepository.findByProjectIdAndTagId(projectId, tagId)

    if (projectTagAlreadyExists) {
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

    return right({ projectTag })
  }
}
