import { makeProject } from '@tests/factories/make-project'
import { makeProjectStar } from '@tests/factories/make-project-star'
import { InMemoryProjectStarsRepository } from '@tests/repositories/in-memory-project-stars-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { GetMyStarOnProjectUseCase } from './get-my-star-on-project'

let projectsRepository: InMemoryProjectsRepository
let projectStarsRepository: InMemoryProjectStarsRepository
let sut: GetMyStarOnProjectUseCase

describe('(UC) - Get My Star On Project', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectStarsRepository = new InMemoryProjectStarsRepository()
    sut = new GetMyStarOnProjectUseCase(projectsRepository, projectStarsRepository)
  })

  it('should return the active star of the current user on the project', async () => {
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
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.star?.id.toString()).toBe(projectStar.id.toString())
      expect(result.value.star?.active).toBe(true)
    }
  })

  it('should return null when the user has no active star on the project', async () => {
    const userId = new UniqueEntityId()
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })

    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      userId: userId.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.star).toBeNull()
    }
  })

  it('should not return a star from another user', async () => {
    const userId = new UniqueEntityId()
    const otherUserId = new UniqueEntityId()
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })

    projectsRepository.items.push(project)
    projectStarsRepository.items.push(
      makeProjectStar({
        projectId: project.id,
        userId: otherUserId,
        active: true,
      }).projectStar,
    )

    const result = await sut.execute({
      projectId: project.id.toString(),
      userId: userId.toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.star).toBeNull()
    }
  })

  it('should not get star when project does not exist', async () => {
    const result = await sut.execute({
      projectId: new UniqueEntityId().toString(),
      userId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })
})
