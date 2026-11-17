import { type Either, left, right } from '@/core/either'
import { type Project, ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectMembersRepository } from '../../repositories/project-members-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface GetProjectByIdUseCaseRequest {
  projectId: string
  requesterId: string
}

type GetProjectByIdUseCaseResponse = Either<ProjectNotFoundError, { project: Project }>

export class GetProjectByIdUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectMembersRepository: ProjectMembersRepository,
  ) {}

  async execute({ projectId, requesterId }: GetProjectByIdUseCaseRequest): Promise<GetProjectByIdUseCaseResponse> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      return left(new ProjectNotFoundError())
    }

    if (!(await this.canAccessProject(project, requesterId))) {
      return left(new ProjectNotFoundError())
    }

    return right({ project })
  }

  private async canAccessProject(project: Project, requesterId: string): Promise<boolean> {
    const isOwner = project.author.toString() === requesterId
    const isPublished = project.status === ProjectStatus.PUBLISHED

    if (isOwner || isPublished) {
      return true
    }

    return this.isProjectMember(project.id.toString(), requesterId)
  }

  private async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    const projectMember = await this.projectMembersRepository.findByProjectAndUser(projectId, userId)

    return projectMember?.status === ProjectMemberStatus.ACCEPTED
  }
}
