import { makeProject } from '@tests/factories/make-project'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { NotProjectOwnerError } from '../../_errors/not-project-owner-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { UpdateProjectUseCase } from './update-project'

let projectsRepository: InMemoryProjectsRepository
let sut: UpdateProjectUseCase

describe('(UC) - Update Project', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    sut = new UpdateProjectUseCase(projectsRepository)
  })

  it('should be able to update a sketch project as owner', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: project.author.toString(),
      title: 'Novo título',
      description: 'Nova descrição',
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.project.title).toBe('Novo título')
      expect(result.value.project.description).toBe('Nova descrição')
    }
  })

  it('should be able to update status to published as owner', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: project.author.toString(),
      title: project.title,
      description: project.description,
      status: ProjectStatus.PUBLISHED,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.project.status).toBe(ProjectStatus.PUBLISHED)
    }
  })

  it('should be able to update a non-sketch project as owner', async () => {
    const { project } = makeProject({ status: ProjectStatus.SCHEDULED })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: project.author.toString(),
      title: 'Novo',
      description: 'Novo',
      status: ProjectStatus.PUBLISHED,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.project.title).toBe('Novo')
      expect(result.value.project.status).toBe(ProjectStatus.PUBLISHED)
    }
  })

  it('should not be able to update a project that does not exist', async () => {
    const result = await sut.execute({
      projectId: 'non-existent',
      authorId: new UniqueEntityId().toString(),
      title: 'Título',
      description: 'Descrição',
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('should not be able to update a project as non-owner', async () => {
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      authorId: new UniqueEntityId().toString(),
      title: 'Hack',
      description: 'Hack',
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotProjectOwnerError)
    }
  })
})
