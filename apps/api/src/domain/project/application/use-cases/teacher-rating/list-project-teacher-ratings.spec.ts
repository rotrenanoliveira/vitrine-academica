import { makeProject } from '@tests/factories/make-project'
import { makeProjectTeacherRating } from '@tests/factories/make-project-teacher-rating'
import { makeRatingCriterion } from '@tests/factories/make-rating-criterion'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryProjectTeacherRatingsRepository } from '@tests/repositories/in-memory-project-teacher-ratings-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryRatingCriteriaRepository } from '@tests/repositories/in-memory-rating-criteria-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { TeacherRatingItem } from '../../../enterprise/entities/teacher-rating-item'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { ListProjectTeacherRatingsUseCase } from './list-project-teacher-ratings'

let projectsRepository: InMemoryProjectsRepository
let ratingsRepository: InMemoryProjectTeacherRatingsRepository
let criteriaRepository: InMemoryRatingCriteriaRepository
let usersRepository: InMemoryUsersRepository
let sut: ListProjectTeacherRatingsUseCase

describe('(UC) - List Project Teacher Ratings', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    ratingsRepository = new InMemoryProjectTeacherRatingsRepository()
    criteriaRepository = new InMemoryRatingCriteriaRepository()
    usersRepository = new InMemoryUsersRepository()
    sut = new ListProjectTeacherRatingsUseCase(
      projectsRepository,
      ratingsRepository,
      criteriaRepository,
      usersRepository,
    )
  })

  it('should be able to list ratings', async () => {
    const { user: teacher } = makeUser({ name: 'Prof. Ana' })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { criterion } = makeRatingCriterion({ name: 'Originalidade e inovação' })

    const ratingId = new UniqueEntityId()
    const { teacherRating } = makeProjectTeacherRating(
      {
        projectId: project.id,
        teacherId: teacher.id,
        overallScore: 8.5,
        items: [
          TeacherRatingItem.create({
            ratingId,
            criterionId: criterion.id,
            score: 8.5,
          }),
        ],
      },
      ratingId,
    )

    usersRepository.items.push(teacher)
    projectsRepository.items.push(project)
    criteriaRepository.items.push(criterion)
    ratingsRepository.items.push(teacherRating)

    const result = await sut.execute({ projectId: project.id.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].teacher.name).toBe('Prof. Ana')
      expect(result.value.items[0].teacherRating.overallScore).toBe(8.5)
      expect(result.value.criteria).toHaveLength(1)
    }
  })

  it('should not be able to rate with a project does not exist', async () => {
    const result = await sut.execute({ projectId: new UniqueEntityId().toString() })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })
})
