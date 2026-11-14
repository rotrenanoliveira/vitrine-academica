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
    limit = 100,
  }: FetchProjectsUseCaseRequest): Promise<FetchProjectsUseCaseResponse> {
    let ids: string[] | undefined

    if (tagIds) {
      const projectTags = await this.projectTagsRepository.findByTagIds(tagIds)
      ids = [...new Set(projectTags.map((projectTag) => projectTag.projectId.toString()))]

      if (ids.length === 0) {
        return right({ projects: [], total: 0, page, limit })
      }
    }

    const normalizedTitle = title?.trim()
    const filters = {
      status,
      title: normalizedTitle ? normalizedTitle : undefined,
      ids,
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
}
