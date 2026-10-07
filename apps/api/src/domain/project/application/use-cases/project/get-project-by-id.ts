import { type Either, left, right } from '@/core/either'
import { ProjectStatus, type Project } from '../../../enterprise/entities/project'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface GetProjectByIdUseCaseRequest {
  projectId: string
  requesterId: string
}

type GetProjectByIdUseCaseResponse = Either<ProjectNotFoundError, { project: Project }>

export class GetProjectByIdUseCase {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async execute({ projectId, requesterId }: GetProjectByIdUseCaseRequest): Promise<GetProjectByIdUseCaseResponse> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      return left(new ProjectNotFoundError())
    }

    const isOwner = project.author.toString() === requesterId
    const isPublished = project.status === ProjectStatus.PUBLISHED

    if (!isOwner && !isPublished) {
      return left(new ProjectNotFoundError())
    }

    return right({ project })
  }
}
