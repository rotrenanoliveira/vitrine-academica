import { type Either, right } from '@/core/either'
import type { Project, ProjectStatus } from '../../../enterprise/entities/project'
import type { ProjectTagsRepository } from '../../repositories/project-tags-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface FetchProjectsUseCaseRequest {
  status?: ProjectStatus
  tagIds?: string[]
  title?: string
}

type FetchProjectsUseCaseResponse = Either<never, { projects: Project[] }>

export class FetchProjectsUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectTagsRepository: ProjectTagsRepository,
  ) {}

  async execute({ status, tagIds, title }: FetchProjectsUseCaseRequest): Promise<FetchProjectsUseCaseResponse> {
    let ids: string[] | undefined

    if (tagIds) {
      const projectTags = await this.projectTagsRepository.findByTagIds(tagIds)
      ids = [...new Set(projectTags.map((projectTag) => projectTag.projectId.toString()))]

      if (ids.length === 0) {
        return right({ projects: [] })
      }
    }

    const normalizedTitle = title?.trim()
    const projects = await this.projectsRepository.findMany({
      status,
      title: normalizedTitle ? normalizedTitle : undefined,
      ids,
    })

    return right({ projects })
  }
}
