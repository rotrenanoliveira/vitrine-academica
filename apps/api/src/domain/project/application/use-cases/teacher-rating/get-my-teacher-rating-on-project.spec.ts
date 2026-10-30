import { makeProject } from '@tests/factories/make-project'
import { makeProjectTeacherRating } from '@tests/factories/make-project-teacher-rating'
import { InMemoryProjectTeacherRatingsRepository } from '@tests/repositories/in-memory-project-teacher-ratings-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { GetMyTeacherRatingOnProjectUseCase } from './get-my-teacher-rating-on-project'

let projectsRepository: InMemoryProjectsRepository
let ratingsRepository: InMemoryProjectTeacherRatingsRepository
let sut: GetMyTeacherRatingOnProjectUseCase

describe('(UC) - Get My Teacher Rating On Project', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    ratingsRepository = new InMemoryProjectTeacherRatingsRepository()
    sut = new GetMyTeacherRatingOnProjectUseCase(projectsRepository, ratingsRepository)
  })

  it('should be able to return rating for teacher on project', async () => {
    const teacherId = new UniqueEntityId()
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { teacherRating } = makeProjectTeacherRating({
      projectId: project.id,
      teacherId,
      overallScore: 7.5,
    })

    projectsRepository.items.push(project)
    ratingsRepository.items.push(teacherRating)

    const result = await sut.execute({
      projectId: project.id.toString(),
      teacherId: teacherId.toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.rating?.overallScore).toBe(7.5)
    }
  })

  it('should return null when teacher has not rated', async () => {
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      teacherId: new UniqueEntityId().toString(),
    })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.rating).toBeNull()
    }
  })

  it('should not be able to get rating if project does not exists', async () => {
    const result = await sut.execute({
      projectId: new UniqueEntityId().toString(),
      teacherId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })
})
