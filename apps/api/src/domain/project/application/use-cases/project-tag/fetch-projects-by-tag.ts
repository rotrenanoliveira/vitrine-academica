import { type Either, left, right } from '@/core/either'
import type { Project } from '@/domain/project/enterprise/entities/project'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import type { TagsRepository } from '@/domain/tag/application/repositories/tags-repository'
import type { ProjectTagsRepository } from '../../repositories/project-tags-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface FetchProjectsByTagUseCaseRequest {
  tagId: string
}

type FetchProjectsByTagUseCaseResponse = Either<TagNotFoundError, { projects: Project[] }>

export class FetchProjectsByTagUseCase {
  constructor(
    private readonly projectTagsRepository: ProjectTagsRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly tagsRepository: TagsRepository,
  ) {}

  async execute({ tagId }: FetchProjectsByTagUseCaseRequest): Promise<FetchProjectsByTagUseCaseResponse> {
    const tag = await this.tagsRepository.findById(tagId)

    if (!tag) {
      return left(new TagNotFoundError())
    }

    const projectTags = await this.projectTagsRepository.findByTagId(tagId)
    const projectIds = projectTags.map((projectTag) => projectTag.projectId.toString())
    const projects = await this.projectsRepository.findManyByIds(projectIds)

    return right({ projects })
  }
}
