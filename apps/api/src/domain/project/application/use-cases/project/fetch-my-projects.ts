import { type Either, right } from '@/core/either'
import type { Project } from '../../../enterprise/entities/project'
import { ProjectMemberStatus } from '../../../enterprise/entities/project-member'
import type { ProjectMembersRepository } from '../../repositories/project-members-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface FetchMyProjectsUseCaseRequest {
  authorId: string
  status?: string
}

type FetchMyProjectsUseCaseResponse = Either<never, { projects: Project[] }>

export class FetchMyProjectsUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectMembersRepository: ProjectMembersRepository,
  ) {}

  async execute({ authorId, status }: FetchMyProjectsUseCaseRequest): Promise<FetchMyProjectsUseCaseResponse> {
    const authoredProjects = await this.projectsRepository.findManyByAuthorId(authorId, status)
    const coauthoredProjects = await this.findCoauthoredProjects(authorId, status, authoredProjects)

    const projects = [...authoredProjects, ...coauthoredProjects].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )

    return right({ projects })
  }

  private async findCoauthoredProjects(
    userId: string,
    status: string | undefined,
    authoredProjects: Project[],
  ): Promise<Project[]> {
    const memberships = await this.projectMembersRepository.findManyByUserId(userId, ProjectMemberStatus.ACCEPTED)

    if (memberships.length === 0) {
      return []
    }

    const projectIds = memberships.map((membership) => membership.projectId.toString())
    const projects = await this.projectsRepository.findManyByIds(projectIds)
    const authoredIds = new Set(authoredProjects.map((project) => project.id.toString()))

    // Por garantia, nunca repete um projeto que a pessoa já criou
    return projects.filter(
      (project) => (status === undefined || project.status === status) && !authoredIds.has(project.id.toString()),
    )
  }
}
