import { makeProject } from '@tests/factories/make-project'
import { makeTag } from '@tests/factories/make-tag'
import { InMemoryProjectTagsRepository } from '@tests/repositories/in-memory-project-tags-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryTagsRepository } from '@tests/repositories/in-memory-tags-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { ProjectTagAlreadyExistsError } from '../../_errors/project-tag-already-exists-error'
import { RegisterProjectTagUseCase } from './register-project-tag'

let projectTagsRepository: InMemoryProjectTagsRepository
let projectsRepository: InMemoryProjectsRepository
let tagsRepository: InMemoryTagsRepository
let sut: RegisterProjectTagUseCase

describe('(UC) - Register Project Tag', () => {
  beforeEach(() => {
    projectTagsRepository = new InMemoryProjectTagsRepository()
    projectsRepository = new InMemoryProjectsRepository()
    tagsRepository = new InMemoryTagsRepository()
    sut = new RegisterProjectTagUseCase(projectTagsRepository, projectsRepository, tagsRepository)
  })

  it('pode registrar uma tag em um projeto', async () => {
    const { project } = makeProject()
    const { tag } = makeTag()
    projectsRepository.items.push(project)
    tagsRepository.items.push(tag)

    const result = await sut.execute({
      projectId: project.id.toString(),
      tagId: tag.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projectTag.projectId.toString()).toBe(project.id.toString())
      expect(result.value.projectTag.tagId.toString()).toBe(tag.id.toString())
      expect(projectTagsRepository.items).toHaveLength(1)
      expect(project.tags).toContain(tag.id.toString())
    }
  })

  it('sincroniza a coluna denormalizada project.tags ao vincular', async () => {
    const { project } = makeProject()
    const { tag } = makeTag()
    projectsRepository.items.push(project)
    tagsRepository.items.push(tag)

    await sut.execute({
      projectId: project.id.toString(),
      tagId: tag.id.toString(),
    })

    const saved = projectsRepository.items.find((item) => item.id.toString() === project.id.toString())

    expect(saved?.tags).toEqual([tag.id.toString()])
  })

  it('não pode registrar uma tag quando o projeto não existe', async () => {
    const { tag } = makeTag()
    tagsRepository.items.push(tag)

    const result = await sut.execute({
      projectId: new UniqueEntityId().toString(),
      tagId: tag.id.toString(),
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('não pode registrar uma tag quando a taf não existe', async () => {
    const { project } = makeProject()
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      tagId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(TagNotFoundError)
    }
  })

  it('não pode registrar uma tag já registrada a um projeto', async () => {
    const { project } = makeProject()
    const { tag } = makeTag()
    projectsRepository.items.push(project)
    tagsRepository.items.push(tag)

    await sut.execute({
      projectId: project.id.toString(),
      tagId: tag.id.toString(),
    })

    const result = await sut.execute({
      projectId: project.id.toString(),
      tagId: tag.id.toString(),
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectTagAlreadyExistsError)
    }
  })
})
