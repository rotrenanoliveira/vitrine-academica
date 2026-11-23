import { type Either, right } from '@/core/either'
import type { Project, ProjectStatus } from '../../../enterprise/entities/project'
import type { ProjectTagsRepository } from '../../repositories/project-tags-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface FetchProjectsUseCaseRequest {
  status?: ProjectStatus
  tagIds?: string[]
  title?: string
  page?: number
  limit?: number
}

type FetchProjectsUseCaseResponse = Either<
  never,
  {
    projects: Project[]
    total: number
    page: number
    limit: number
  }
>

export class FetchProjectsUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectTagsRepository: ProjectTagsRepository,
  ) {}

  async execute({
    status,
    tagIds,
    title,
    page = 1,
    limit = 25,
  }: FetchProjectsUseCaseRequest): Promise<FetchProjectsUseCaseResponse> {
    const tagProjectIds = await this.resolveProjectIdsByTags(tagIds)

    if (tagProjectIds !== undefined && tagProjectIds.length === 0) {
      return right({ projects: [], total: 0, page, limit })
    }

    const normalizedTitle = title?.trim()
    const filters = {
      status,
      title: normalizedTitle ? normalizedTitle : undefined,
      ids: tagProjectIds,
    }

    const [total, projects] = await Promise.all([
      this.projectsRepository.countMany(filters),
      this.projectsRepository.findMany({
        ...filters,
        page,
        limit,
      }),
    ])

    return right({ projects, total, page, limit })
  }

  private async resolveProjectIdsByTags(tagIds?: string[]): Promise<string[] | undefined> {
    if (!tagIds) {
      return undefined
    }

    const projectTags = await this.projectTagsRepository.findByTagIds(tagIds)

    return [...new Set(projectTags.map((projectTag) => projectTag.projectId.toString()))]
  }
}
