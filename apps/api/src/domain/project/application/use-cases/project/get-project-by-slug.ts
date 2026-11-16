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

    const projectId = project.id.toString()
    const isOwner = Boolean(requesterId) && project.author.toString() === requesterId
    const isPublished = project.status === ProjectStatus.PUBLISHED

    // Visitante só vê publicado. Dono vê qualquer status. Coautor aceito e convite pendente também leem.
    if (!isOwner && !isPublished && !(requesterId && (await this.canReadUnpublished(projectId, requesterId)))) {
      return left(new ProjectNotFoundError())
    }

    const schedule = await this.projectScheduledRepository.findById(projectId)

    return right({ project, publishedIn: schedule?.publishedIn ?? null })
  }

  // Convite recusado não conta: só aceito ou pendente leem o projeto ainda não publicado
  private async canReadUnpublished(projectId: string, userId: string): Promise<boolean> {
    const projectMember = await this.projectMembersRepository.findByProjectAndUser(projectId, userId)

    return (
      projectMember?.status === ProjectMemberStatus.ACCEPTED || projectMember?.status === ProjectMemberStatus.PENDING
    )
  }
}
