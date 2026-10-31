import { makeProject } from '@tests/factories/make-project'
import { makeProjectStar } from '@tests/factories/make-project-star'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryProjectStarsRepository } from '@tests/repositories/in-memory-project-stars-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { StarNotFoundError } from '../../_errors/star-not-found-error'
import { UnstarProjectUseCase } from './unstar-project'

let projectsRepository: InMemoryProjectsRepository
let projectStarsRepository: InMemoryProjectStarsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: UnstarProjectUseCase

describe('(UC) - Unstar Project', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectStarsRepository = new InMemoryProjectStarsRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()

    sut = new UnstarProjectUseCase(
      projectsRepository,
      projectStarsRepository,
      new RegisterLogUseCase(auditLogsRepository),
    )
  })

  it('should be able to unstar a project', async () => {
    const userId = new UniqueEntityId()
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { projectStar } = makeProjectStar({
      projectId: project.id,
      userId,
      active: true,
    })

    projectsRepository.items.push(project)
    projectStarsRepository.items.push(projectStar)

    const result = await sut.execute({
      projectId: project.id.toString(),
      userId: userId.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(result.isRight()).toBeTruthy()
    expect(projectStar.active).toBe(false)
  })

  it('should not be ablet to unstar when there is no active star', async () => {
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      userId: new UniqueEntityId().toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(StarNotFoundError)
    }
  })

  it('should not be able to unstar when project does not exist', async () => {
    const result = await sut.execute({
      projectId: new UniqueEntityId().toString(),
      userId: new UniqueEntityId().toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })
})
