import { makeProject } from '@tests/factories/make-project'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { FetchMyProjectsUseCase } from './fetch-my-projects'

let projectsRepository: InMemoryProjectsRepository
let sut: FetchMyProjectsUseCase

describe('(UC) - Fetch My Projects', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    sut = new FetchMyProjectsUseCase(projectsRepository)
  })

  it('should be able to fetch projects of the author', async () => {
    const { project: mine } = makeProject()
    const { project: other } = makeProject()
    projectsRepository.items.push(mine, other)

    const result = await sut.execute({ authorId: mine.author.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].id.toString()).toBe(mine.id.toString())
    }
  })

  it('should be able to filter projects by status', async () => {
    const author = makeProject().project.author
    const { project: sketch } = makeProject({ author, status: ProjectStatus.SKETCH })
    const { project: published } = makeProject({ author, status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(sketch, published)

    const result = await sut.execute({
      authorId: author.toString(),
      status: ProjectStatus.SKETCH,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].status).toBe(ProjectStatus.SKETCH)
    }
  })
})
