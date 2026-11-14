import { type Either, left, right } from '@/core/either'
import { UserNotFoundError } from '@/domain/identity/application/_errors/user-not-found-error'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { Project } from '../../../enterprise/entities/project'
import { ProjectStatus } from '../../../enterprise/entities/project'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface FetchAuthorPublishedProjectsUseCaseRequest {
  authorId: string
}

type FetchAuthorPublishedProjectsUseCaseResponse = Either<
  UserNotFoundError,
  {
    author: { id: string; name: string }
    projects: Project[]
  }
>

export class FetchAuthorPublishedProjectsUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  async execute({
    authorId,
  }: FetchAuthorPublishedProjectsUseCaseRequest): Promise<FetchAuthorPublishedProjectsUseCaseResponse> {
    const author = await this.usersRepository.findById(authorId)

    if (!author) {
      return left(new UserNotFoundError())
    }

    const projects = await this.projectsRepository.findManyByAuthorId(authorId, ProjectStatus.PUBLISHED)

    return right({
      author: {
        id: author.id.toString(),
        name: author.name,
      },
      projects,
    })
  }
}
