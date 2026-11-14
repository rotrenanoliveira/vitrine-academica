import { makeProject } from '@tests/factories/make-project'
import { makeProjectTeacherRating } from '@tests/factories/make-project-teacher-rating'
import { InMemoryProjectTeacherRatingsRepository } from '@tests/repositories/in-memory-project-teacher-ratings-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { ListMyTeacherRatingsUseCase } from './list-my-teacher-ratings'

let projectsRepository: InMemoryProjectsRepository
let ratingsRepository: InMemoryProjectTeacherRatingsRepository
let sut: ListMyTeacherRatingsUseCase

describe('(UC) - List My Teacher Ratings', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    ratingsRepository = new InMemoryProjectTeacherRatingsRepository()
    sut = new ListMyTeacherRatingsUseCase(projectsRepository, ratingsRepository)
  })

  it('should be able to list ratings of a teacher', async () => {
    const teacherId = new UniqueEntityId()
    const otherTeacherId = new UniqueEntityId()
    const { project: projectA } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { project: projectB } = makeProject({ status: ProjectStatus.PUBLISHED })

    projectsRepository.items.push(projectA, projectB)
    ratingsRepository.items.push(
      makeProjectTeacherRating({
        projectId: projectA.id,
        teacherId,
        overallScore: 8,
      }).teacherRating,
      makeProjectTeacherRating({
        projectId: projectB.id,
        teacherId: otherTeacherId,
        overallScore: 9,
      }).teacherRating,
    )

    const result = await sut.execute({ teacherId: teacherId.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].project.id.toString()).toBe(projectA.id.toString())
      expect(result.value.items[0].rating.overallScore).toBe(8)
    }
  })
})
