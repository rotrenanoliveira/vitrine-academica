import { type Either, left, right } from '@/core/either'
import { type Project, ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectMembersRepository } from '../../repositories/project-members-repository'
import type { ProjectScheduledRepository } from '../../repositories/project-scheduled-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface GetProjectBySlugUseCaseRequest {
  slug: string
  requesterId?: string
}

type GetProjectBySlugUseCaseResponse = Either<ProjectNotFoundError, { project: Project; publishedIn: Date | null }>

export class GetProjectBySlugUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectMembersRepository: ProjectMembersRepository,
    private readonly projectScheduledRepository: ProjectScheduledRepository,
  ) {}

  async execute({ slug, requesterId }: GetProjectBySlugUseCaseRequest): Promise<GetProjectBySlugUseCaseResponse> {
    const project = await this.projectsRepository.findBySlug(slug)

    if (!project) {
      return left(new ProjectNotFoundError())
    }

    if (!(await this.canAccessProject(project, requesterId))) {
      return left(new ProjectNotFoundError())
    }

    const schedule = await this.projectScheduledRepository.findById(project.id.toString())

    return right({ project, publishedIn: schedule?.publishedIn ?? null })
  }

  private async canAccessProject(project: Project, requesterId?: string): Promise<boolean> {
    const isOwner = Boolean(requesterId) && project.author.toString() === requesterId
    const isPublished = project.status === ProjectStatus.PUBLISHED

    if (isOwner || isPublished) {
      return true
    }

    if (!requesterId) {
      return false
    }

    return this.isProjectMember(project.id.toString(), requesterId)
  }

  private async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    const projectMember = await this.projectMembersRepository.findByProjectAndUser(projectId, userId)

    return (
      projectMember?.status === ProjectMemberStatus.ACCEPTED || projectMember?.status === ProjectMemberStatus.PENDING
    )
  }
}
