import { type Either, right } from '@/core/either'
import { type Project, ProjectStatus } from '../../enterprise/entities/project'
import type { ProjectsRepository } from '../repositories/projects-repositories'

type FetchPublishedProjectsUseCaseResponse = Either<never, { projects: Project[] }>

export class FetchPublishedProjectsUseCase {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async execute(): Promise<FetchPublishedProjectsUseCaseResponse> {
    const projects = await this.projectsRepository.findAll()
    const published = projects.filter((project) => project.status === ProjectStatus.PUBLISHED)

    return right({ projects: published })
  }
}
