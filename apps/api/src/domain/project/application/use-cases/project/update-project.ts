import { type Either, left, right } from '@/core/either'
import type { Project, ProjectStatus } from '../../../enterprise/entities/project'
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface UpdateProjectUseCaseRequest {
  projectId: string
  authorId: string
  title: string
  description: string
  status?: ProjectStatus
  attachments?: string[]
}

type UpdateProjectUseCaseResponse = Either<ProjectNotFoundError | NotProjectOwnerError, { project: Project }>

export class UpdateProjectUseCase {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async execute({
    projectId,
    authorId,
    title,
    description,
    status,
    attachments,
  }: UpdateProjectUseCaseRequest): Promise<UpdateProjectUseCaseResponse> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      return left(new ProjectNotFoundError())
    }

    if (project.author.toString() !== authorId) {
      return left(new NotProjectOwnerError())
    }

    project.title = title
    project.description = description

    if (status !== undefined) {
      project.status = status
    }

    if (attachments !== undefined) {
      project.attachments = attachments
    }

    await this.projectsRepository.save(project)

    return right({ project })
  }
}
