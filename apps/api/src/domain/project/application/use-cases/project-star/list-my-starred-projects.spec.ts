import { makeProject } from '@tests/factories/make-project'
import { makeProjectStar } from '@tests/factories/make-project-star'
import { InMemoryProjectStarsRepository } from '@tests/repositories/in-memory-project-stars-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ListMyStarredProjectsUseCase } from './list-my-starred-projects'

let projectsRepository: InMemoryProjectsRepository
let projectStarsRepository: InMemoryProjectStarsRepository
let sut: ListMyStarredProjectsUseCase

describe('(UC) - List My Starred Projects', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectStarsRepository = new InMemoryProjectStarsRepository()
    sut = new ListMyStarredProjectsUseCase(projectsRepository, projectStarsRepository)
  })

  it('should list only projects starred by the current user', async () => {
    const userId = new UniqueEntityId()
    const otherUserId = new UniqueEntityId()
    const { project: mine } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { project: other } = makeProject({ status: ProjectStatus.PUBLISHED })

    projectsRepository.items.push(mine, other)
    projectStarsRepository.items.push(
      makeProjectStar({
        projectId: mine.id,
        userId,
        active: true,
        ratedAt: new Date('2026-10-20T10:00:00.000Z'),
      }).projectStar,
      makeProjectStar({
        projectId: other.id,
        userId: otherUserId,
        active: true,
      }).projectStar,
    )

    const result = await sut.execute({ userId: userId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].project.id.toString()).toBe(mine.id.toString())
    }
  })
})
