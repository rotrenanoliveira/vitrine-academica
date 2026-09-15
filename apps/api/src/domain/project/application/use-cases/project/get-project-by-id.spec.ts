import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeProject } from '@tests/factories/make-project'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { GetProjectByIdUseCase } from './get-project-by-id'

let projectsRepository: InMemoryProjectsRepository
let sut: GetProjectByIdUseCase

describe('(UC) - Get Project By Id', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    sut = new GetProjectByIdUseCase(projectsRepository)
  })

  it('should allow the owner to get a sketch project', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      requesterId: project.author.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.project.id.toString()).toBe(project.id.toString())
    }
  })

  it('should allow anyone to get a published project', async () => {
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      requesterId: new UniqueEntityId().toString(),
    })

    expect(result.isRight()).toBeTruthy()
  })

  it('should not allow a non-owner to get a sketch project', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      requesterId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('should not be able to get a project that does not exist', async () => {
    const result = await sut.execute({
      projectId: 'non-existent',
      requesterId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })
})
