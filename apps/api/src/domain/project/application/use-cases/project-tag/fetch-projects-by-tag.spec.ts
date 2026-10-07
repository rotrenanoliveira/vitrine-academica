import { makeProject } from '@tests/factories/make-project'
import { makeProjectTag } from '@tests/factories/make-project-tag'
import { makeTag } from '@tests/factories/make-tag'
import { InMemoryProjectTagsRepository } from '@tests/repositories/in-memory-project-tags-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryTagsRepository } from '@tests/repositories/in-memory-tags-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { TagNotFoundError } from '@/domain/tag/application/_errors/tag-not-found-error'
import { FetchProjectsByTagUseCase } from './fetch-projects-by-tag'

let projectTagsRepository: InMemoryProjectTagsRepository
let projectsRepository: InMemoryProjectsRepository
let tagsRepository: InMemoryTagsRepository
let sut: FetchProjectsByTagUseCase

describe('(UC) - Fetch Projects By Tag', () => {
  beforeEach(() => {
    projectTagsRepository = new InMemoryProjectTagsRepository()
    projectsRepository = new InMemoryProjectsRepository()
    tagsRepository = new InMemoryTagsRepository()
    sut = new FetchProjectsByTagUseCase(projectTagsRepository, projectsRepository, tagsRepository)
  })

  it('pode buscar projetos relacionados a uma tag', async () => {
    const { tag } = makeTag()
    const { project: firstProject } = makeProject()
    const { project: secondProject } = makeProject()
    const { project: unrelatedProject } = makeProject()

    tagsRepository.items.push(tag)
    projectsRepository.items.push(firstProject, secondProject, unrelatedProject)

    const { projectTag: firstProjectTag } = makeProjectTag({
      projectId: firstProject.id,
      tagId: tag.id,
    })
    const { projectTag: secondProjectTag } = makeProjectTag({
      projectId: secondProject.id,
      tagId: tag.id,
    })
    projectTagsRepository.items.push(firstProjectTag, secondProjectTag)

    const result = await sut.execute({
      tagId: tag.id.toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(2)
      expect(result.value.projects.map((project) => project.id.toString())).toEqual(
        expect.arrayContaining([firstProject.id.toString(), secondProject.id.toString()]),
      )
    }
  })

  it('não pode buscar projetos quando a tag não existe', async () => {
    const result = await sut.execute({
      tagId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(TagNotFoundError)
    }
  })
})
