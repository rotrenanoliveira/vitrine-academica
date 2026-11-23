import { type Either, left, right } from '@/core/either'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { User } from '@/domain/identity/enterprise/entities/user'
import { type Project, ProjectStatus } from '../../../enterprise/entities/project'
import { type ProjectMember, ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectMembersRepository } from '../../repositories/project-members-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface ListProjectMembersUseCaseRequest {
  projectId: string
  requesterId?: string
}

export type ProjectMemberItem = {
  projectMember: ProjectMember
  user: User
}

type ListProjectMembersUseCaseResponse = Either<ProjectNotFoundError, { members: ProjectMemberItem[] }>

export class ListProjectMembersUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly projectMembersRepository: ProjectMembersRepository,
  ) {}

  async execute({
    projectId,
    requesterId,
  }: ListProjectMembersUseCaseRequest): Promise<ListProjectMembersUseCaseResponse> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      return left(new ProjectNotFoundError())
    }

    if (!(await this.canAccessProject(project, requesterId))) {
      return left(new ProjectNotFoundError())
    }

    const isOwner = Boolean(requesterId) && project.author.toString() === requesterId
    const members = await this.findProjectMembers(projectId, isOwner)

    return right({ members })
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

  private async findProjectMembers(projectId: string, isOwner: boolean): Promise<ProjectMemberItem[]> {
    const projectMembers = await this.projectMembersRepository.findManyByProjectId(projectId)

    const visibleMembers = projectMembers.filter((projectMember) =>
      isOwner
        ? projectMember.status !== ProjectMemberStatus.REJECTED
        : projectMember.status === ProjectMemberStatus.ACCEPTED,
    )

    const users = await Promise.all(
      visibleMembers.map((projectMember) => this.usersRepository.findById(projectMember.userId.toString())),
    )

    return visibleMembers.flatMap((projectMember, index) => {
      const user = users[index]

      if (!user) {
        return []
      }

      return [{ projectMember, user }]
    })
  }
}
