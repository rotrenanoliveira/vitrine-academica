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

    const isOwner = project.author.toString() === requesterId
    const isPublished = project.status === ProjectStatus.PUBLISHED

    // Quem não é o dono nem vê um projeto publicado só abre o projeto se aceitou ser coautor dele
    if (!isOwner && !isPublished && !(await this.isAcceptedMember(projectId, requesterId))) {
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
