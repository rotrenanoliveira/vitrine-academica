import { makeProject } from '@tests/factories/make-project'
import { makeProjectStar } from '@tests/factories/make-project-star'
import { InMemoryProjectStarsRepository } from '@tests/repositories/in-memory-project-stars-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { GetProjectRatingsUseCase } from './get-project-ratings'

let projectsRepository: InMemoryProjectsRepository
let projectStarsRepository: InMemoryProjectStarsRepository
let sut: GetProjectRatingsUseCase

describe('(UC) - Get Project Ratings', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectStarsRepository = new InMemoryProjectStarsRepository()
    sut = new GetProjectRatingsUseCase(projectsRepository, projectStarsRepository)
  })

  it('should return aggregated star ratings', async () => {
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(project)

    projectStarsRepository.items.push(
      makeProjectStar({ projectId: project.id, userId: new UniqueEntityId(), weight: 1, active: true }).projectStar,
      makeProjectStar({ projectId: project.id, userId: new UniqueEntityId(), weight: 5, active: true }).projectStar,
      makeProjectStar({ projectId: project.id, userId: new UniqueEntityId(), weight: 1, active: false }).projectStar,
    )

    const result = await sut.execute({ projectId: project.id.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.rating.starsCount).toBe(2)
      expect(result.value.rating.starsWeightedScore).toBe(6)
      expect(result.value.rating.teacherEvaluationsCount).toBe(0)
      expect(result.value.rating.teacherAverage).toBeNull()
      expect(result.value.rating.teacherScoresByCriterion).toEqual([])
    }
  })

  it('should not return ratings for missing project', async () => {
    const result = await sut.execute({ projectId: new UniqueEntityId().toString() })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })
})
