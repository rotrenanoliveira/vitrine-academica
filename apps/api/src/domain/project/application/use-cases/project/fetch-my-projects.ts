import { type Either, right } from '@/core/either'
import type { Project } from '../../../enterprise/entities/project'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface FetchMyProjectsUseCaseRequest {
  authorId: string
  status?: string
}

type FetchMyProjectsUseCaseResponse = Either<never, { projects: Project[] }>

export class FetchMyProjectsUseCase {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async execute({ authorId, status }: FetchMyProjectsUseCaseRequest): Promise<FetchMyProjectsUseCaseResponse> {
    const projects = await this.projectsRepository.findManyByAuthorId(authorId, status)

    return right({ projects })
  }
}
