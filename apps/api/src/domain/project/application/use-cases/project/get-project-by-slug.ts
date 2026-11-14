import { type Either, left, right } from '@/core/either'
import { type Project, ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectMembersRepository } from '../../repositories/project-members-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface GetProjectBySlugUseCaseRequest {
  slug: string
  requesterId?: string
}

type GetProjectBySlugUseCaseResponse = Either<ProjectNotFoundError, { project: Project }>

export class GetProjectBySlugUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectMembersRepository: ProjectMembersRepository,
  ) {}

  async execute({ slug, requesterId }: GetProjectBySlugUseCaseRequest): Promise<GetProjectBySlugUseCaseResponse> {
    const project = await this.projectsRepository.findBySlug(slug)

    if (!project) {
      return left(new ProjectNotFoundError())
    }

    const projectId = project.id.toString()
    const isOwner = Boolean(requesterId) && project.author.toString() === requesterId
    const isPublished = project.status === ProjectStatus.PUBLISHED

    // Visitante só vê publicado; logado que não é dono/coautor aceito também só vê publicado
    if (!isOwner && !isPublished && !(requesterId && (await this.isAcceptedMember(projectId, requesterId)))) {
      return left(new ProjectNotFoundError())
    }

    return right({ project })
  }

  // Só o convite aceito dá acesso: pendente e recusado não contam
  private async isAcceptedMember(projectId: string, userId: string): Promise<boolean> {
    const projectMember = await this.projectMembersRepository.findByProjectAndUser(projectId, userId)

    return projectMember?.status === ProjectMemberStatus.ACCEPTED
  }
}
