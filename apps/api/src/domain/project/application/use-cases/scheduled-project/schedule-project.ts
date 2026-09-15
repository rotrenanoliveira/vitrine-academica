import { type Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectScheduled } from '../../../enterprise/entities/project-scheduled'
import { InvalidProjectStatusError } from '../../_errors/invalid-project-status-error'
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectAlreadyScheduledError } from '../../_errors/project-already-scheduled-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import type { ProjectScheduledRepository } from '../../repositories/project-scheduled-repository'
import type { ProjectsRepository } from '../../repositories/projects-repositories'

interface ScheduleProjectUseCaseRequest {
  projectId: string
  authorId: string
  publishedIn: Date
}

type ScheduleProjectUseCaseResponse = Either<
  ProjectNotFoundError | NotProjectOwnerError | ProjectAlreadyScheduledError | InvalidProjectStatusError,
  { projectScheduled: ProjectScheduled }
>

export class ScheduleProjectUseCase {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectScheduledRepository: ProjectScheduledRepository,
  ) {}

  async execute({
    projectId,
    authorId,
    publishedIn,
  }: ScheduleProjectUseCaseRequest): Promise<ScheduleProjectUseCaseResponse> {
    const project = await this.projectsRepository.findById(projectId)

    if (!project) {
      return left(new ProjectNotFoundError())
    }

    if (project.author.toString() !== authorId) {
      return left(new NotProjectOwnerError())
    }

    if (project.status !== ProjectStatus.SKETCH) {
      return left(new InvalidProjectStatusError('Somente projetos em rascunho podem ser agendados'))
    }

    const projectAlreadyScheduled = await this.projectScheduledRepository.findById(projectId)

    if (projectAlreadyScheduled) {
      return left(new ProjectAlreadyScheduledError())
    }

    const projectScheduled = ProjectScheduled.create({
      projectId: new UniqueEntityId(projectId),
      publishedIn,
    })

    project.status = ProjectStatus.SCHEDULED

    await this.projectScheduledRepository.create(projectScheduled)
    await this.projectsRepository.save(project)

    return right({ projectScheduled })
  }
}
