import { makeProject } from '@tests/factories/make-project'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { FetchAuthorPublishedProjectsUseCase } from './fetch-author-published-projects'

let usersRepository: InMemoryUsersRepository
let projectsRepository: InMemoryProjectsRepository
let sut: FetchAuthorPublishedProjectsUseCase

describe('(UC) - Fetch Author Published Projects', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    projectsRepository = new InMemoryProjectsRepository()
    sut = new FetchAuthorPublishedProjectsUseCase(usersRepository, projectsRepository)
  })

  it('should be able to list published projects of an author newest first', async () => {
    const { user: author } = makeUser({ name: 'Autor Exemplo' })
    usersRepository.items.push(author)

    const older = makeProject({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
      createdAt: new Date('2024-01-01'),
    }).project
    const newer = makeProject({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
      createdAt: new Date('2024-06-01'),
    }).project
    const sketch = makeProject({
      author: author.id,
      status: ProjectStatus.SKETCH,
    }).project
    const otherAuthor = makeProject({
      author: new UniqueEntityId(),
      status: ProjectStatus.PUBLISHED,
    }).project

    projectsRepository.items.push(older, newer, sketch, otherAuthor)

    const result = await sut.execute({ authorId: author.id.toString() })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.author).toEqual({
        id: author.id.toString(),
        name: 'Autor Exemplo',
      })
      expect(result.value.projects).toHaveLength(2)
      expect(result.value.projects.map((project) => project.id.toString())).toEqual([
        newer.id.toString(),
        older.id.toString(),
      ])
    }
  })

  it('should return an empty list when the author has no published projects', async () => {
    const { user: author } = makeUser({ name: 'Sem Publicados' })
    usersRepository.items.push(author)

    projectsRepository.items.push(
      makeProject({
        author: author.id,
        status: ProjectStatus.SKETCH,
      }).project,
    )

    const result = await sut.execute({ authorId: author.id.toString() })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.author.name).toBe('Sem Publicados')
      expect(result.value.projects).toHaveLength(0)
    }
  })

  it('should not be able to fetch projects of a non-existent author', async () => {
    const result = await sut.execute({ authorId: new UniqueEntityId().toString() })

    expect(result.isLeft()).toBeTruthy()
  })
})
