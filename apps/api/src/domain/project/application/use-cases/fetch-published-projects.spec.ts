import { makeProject } from '@tests/factories/make-project'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { ProjectStatus } from '../../enterprise/entities/project'
import { FetchPublishedProjectsUseCase } from './fetch-published-projects'

let projectsRepository: InMemoryProjectsRepository
let sut: FetchPublishedProjectsUseCase

describe('(UC) - Fetch Published Projects', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    sut = new FetchPublishedProjectsUseCase(projectsRepository)
  })

  it('should able to list all published projects', async () => {
    const { project: publishedA } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { project: publishedB } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { project: scheduled } = makeProject({ status: ProjectStatus.SCHEDULED })
    const { project: sketch } = makeProject({ status: ProjectStatus.SKETCH })

    projectsRepository.items.push(publishedA, publishedB, scheduled, sketch)

    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(2)
      expect(result.value.projects.map((project) => project.id.toString())).toEqual(
        expect.arrayContaining([publishedA.id.toString(), publishedB.id.toString()]),
      )
    }
  })
})
