import { type Either, right } from '@/core/either'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { User } from '@/domain/identity/enterprise/entities/user'
import type { Project } from '../../../enterprise/entities/project'
import type { ProjectMember, ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import type { ProjectMembersRepository } from '../../repositories/project-members-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface ListMyProjectInvitationsUseCaseRequest {
  userId: string
  status?: ProjectMemberStatus
}

export interface ProjectInvitationItem {
  projectMember: ProjectMember
  project: Project
  owner: User | null
}

type ListMyProjectInvitationsUseCaseResponse = Either<never, { invitations: ProjectInvitationItem[] }>

export class ListMyProjectInvitationsUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly projectMembersRepository: ProjectMembersRepository,
  ) {}

  async execute({
    userId,
    status,
  }: ListMyProjectInvitationsUseCaseRequest): Promise<ListMyProjectInvitationsUseCaseResponse> {
    const projectMembers = await this.projectMembersRepository.findManyByUserId(userId, status)

    if (projectMembers.length === 0) {
      return right({ invitations: [] })
    }

    const projectIds = [...new Set(projectMembers.map((projectMember) => projectMember.projectId.toString()))]
    const projects = await this.projectsRepository.findManyByIds(projectIds)
    const projectsById = new Map(projects.map((project) => [project.id.toString(), project]))

    const ownerIds = [...new Set(projects.map((project) => project.author.toString()))]
    const owners = await Promise.all(ownerIds.map((ownerId) => this.usersRepository.findById(ownerId)))
    const ownersById = new Map(ownerIds.map((ownerId, index) => [ownerId, owners[index]]))

    const invitations = projectMembers.flatMap((projectMember) => {
      const project = projectsById.get(projectMember.projectId.toString())

      if (!project) {
        return []
      }

      return [
        {
          projectMember,
          project,
          owner: ownersById.get(project.author.toString()) ?? null,
        },
      ]
    })

    return right({ invitations })
  }
}
