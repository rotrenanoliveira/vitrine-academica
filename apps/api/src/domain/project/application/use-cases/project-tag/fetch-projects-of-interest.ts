import { type Either, left, right } from '@/core/either'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { Project } from '@/domain/project/enterprise/entities/project'
import type { PreferenceTagsRepository } from '@/domain/tag/application/repositories/preference-tags-repository'
import { PreferenceTagStatus } from '@/domain/tag/enterprise/entities/preference-tag'
import type { ProjectTagsRepository } from '../../repositories/project-tags-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface FetchProjectsOfInterestUseCaseRequest {
  userId: string
}

type FetchProjectsOfInterestUseCaseResponse = Either<UserNotFoundError, { projects: Project[] }>

export class FetchProjectsOfInterestUseCase {
  constructor(
    private readonly preferenceTagsRepository: PreferenceTagsRepository,
    private readonly projectTagsRepository: ProjectTagsRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({ userId }: FetchProjectsOfInterestUseCaseRequest): Promise<FetchProjectsOfInterestUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new UserNotFoundError())
    }

    const preferenceTags = await this.preferenceTagsRepository.findByUserId(userId)
    const activeTagIds = preferenceTags
      .filter((preferenceTag) => preferenceTag.status === PreferenceTagStatus.ACTIVE)
      .map((preferenceTag) => preferenceTag.tagId.toString())

    if (activeTagIds.length === 0) {
      return right({ projects: [] })
    }

    const projectTags = await this.projectTagsRepository.findByTagIds(activeTagIds)
    const projectIds = [...new Set(projectTags.map((projectTag) => projectTag.projectId.toString()))]
    const projects = await this.projectsRepository.findManyByIds(projectIds)

    return right({ projects })
  }
}
