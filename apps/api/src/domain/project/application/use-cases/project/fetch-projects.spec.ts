import { makeProject } from '@tests/factories/make-project'
import { makeProjectTag } from '@tests/factories/make-project-tag'
import { InMemoryProjectTagsRepository } from '@tests/repositories/in-memory-project-tags-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { FetchProjectsUseCase } from './fetch-projects'

let projectsRepository: InMemoryProjectsRepository
let projectTagsRepository: InMemoryProjectTagsRepository
let sut: FetchProjectsUseCase

describe('(UC) - Fetch Projects', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectTagsRepository = new InMemoryProjectTagsRepository()
    sut = new FetchProjectsUseCase(projectsRepository, projectTagsRepository)
  })

  it('should be able to fetch all projects', async () => {
    const { project: older } = makeProject({
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      status: ProjectStatus.SKETCH,
    })
    const { project: newer } = makeProject({
      createdAt: new Date('2024-06-01T00:00:00.000Z'),
      status: ProjectStatus.PUBLISHED,
    })

    projectsRepository.items.push(older, newer)

    const result = await sut.execute({})

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects.map((project) => project.id.toString())).toEqual([
        newer.id.toString(),
        older.id.toString(),
      ])
    }
  })

  it('should be able to fetch projects by status', async () => {
    const { project: published } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { project: sketch } = makeProject({ status: ProjectStatus.SKETCH })

    projectsRepository.items.push(published, sketch)

    const result = await sut.execute({ status: ProjectStatus.PUBLISHED })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0]?.id.toString()).toBe(published.id.toString())
    }
  })

  it('should be able to fetch projects by title', async () => {
    const { project: matching } = makeProject({ title: 'Minha Vitrine Acadêmica' })
    const { project: other } = makeProject({ title: 'Outro projeto' })

    projectsRepository.items.push(matching, other)

    const result = await sut.execute({ title: '  vitrine  ' })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0]?.id.toString()).toBe(matching.id.toString())
    }
  })

  it('should be able to fetch projects by any of the tags', async () => {
    const roboticsTagId = new UniqueEntityId()
    const healthTagId = new UniqueEntityId()
    const { project: roboticsProject } = makeProject()
    const { project: healthProject } = makeProject()
    const { project: unrelatedProject } = makeProject()

    projectsRepository.items.push(roboticsProject, healthProject, unrelatedProject)
    projectTagsRepository.items.push(
      makeProjectTag({ projectId: roboticsProject.id, tagId: roboticsTagId }).projectTag,
      makeProjectTag({ projectId: healthProject.id, tagId: healthTagId }).projectTag,
    )

    const result = await sut.execute({
      tagIds: [roboticsTagId.toString(), healthTagId.toString()],
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(2)
      expect(result.value.projects.map((project) => project.id.toString())).toEqual(
        expect.arrayContaining([roboticsProject.id.toString(), healthProject.id.toString()]),
      )
    }
  })

  it('should be able to fetch projects by status, title and tags', async () => {
    const tagId = new UniqueEntityId()
    const { project: matching } = makeProject({
      title: 'Robô publicado',
      status: ProjectStatus.PUBLISHED,
      createdAt: new Date('2024-02-01T00:00:00.000Z'),
    })
    const { project: wrongStatus } = makeProject({
      title: 'Robô rascunho',
      status: ProjectStatus.SKETCH,
    })
    const { project: wrongTitle } = makeProject({
      title: 'Publicado sem o termo',
      status: ProjectStatus.PUBLISHED,
    })
    const { project: withoutTag } = makeProject({
      title: 'Robô sem tag',
      status: ProjectStatus.PUBLISHED,
    })

    projectsRepository.items.push(matching, wrongStatus, wrongTitle, withoutTag)
    projectTagsRepository.items.push(
      makeProjectTag({ projectId: matching.id, tagId }).projectTag,
      makeProjectTag({ projectId: wrongStatus.id, tagId }).projectTag,
      makeProjectTag({ projectId: wrongTitle.id, tagId }).projectTag,
    )

    const result = await sut.execute({
      status: ProjectStatus.PUBLISHED,
      title: 'robô',
      tagIds: [tagId.toString()],
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects.map((project) => project.id.toString())).toEqual([matching.id.toString()])
    }
  })

  it('should return an empty list when no tags are provided', async () => {
    const { project } = makeProject()
    projectsRepository.items.push(project)

    const result = await sut.execute({ tagIds: [] })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(0)
    }
  })
})
