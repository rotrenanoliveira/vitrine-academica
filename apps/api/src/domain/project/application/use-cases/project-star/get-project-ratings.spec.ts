import { makeProject } from '@tests/factories/make-project'
import { makeProjectStar } from '@tests/factories/make-project-star'
import { makeProjectTeacherRating } from '@tests/factories/make-project-teacher-rating'
import { makeRatingCriterion } from '@tests/factories/make-rating-criterion'
import { InMemoryProjectStarsRepository } from '@tests/repositories/in-memory-project-stars-repository'
import { InMemoryProjectTeacherRatingsRepository } from '@tests/repositories/in-memory-project-teacher-ratings-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { TeacherRatingItem } from '../../../enterprise/entities/teacher-rating-item'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { GetProjectRatingsUseCase } from './get-project-ratings'

let projectsRepository: InMemoryProjectsRepository
let projectStarsRepository: InMemoryProjectStarsRepository
let projectTeacherRatingsRepository: InMemoryProjectTeacherRatingsRepository
let sut: GetProjectRatingsUseCase

describe('(UC) - Get Project Ratings', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectStarsRepository = new InMemoryProjectStarsRepository()
    projectTeacherRatingsRepository = new InMemoryProjectTeacherRatingsRepository()
    sut = new GetProjectRatingsUseCase(projectsRepository, projectStarsRepository, projectTeacherRatingsRepository)
  })

  it('should be able to return project rating', async () => {
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    projectsRepository.items.push(project)

    projectStarsRepository.items.push(
      makeProjectStar({ projectId: project.id, userId: new UniqueEntityId(), weight: 1, active: true }).projectStar,
      makeProjectStar({ projectId: project.id, userId: new UniqueEntityId(), weight: 5, active: true }).projectStar,
      makeProjectStar({ projectId: project.id, userId: new UniqueEntityId(), weight: 1, active: false }).projectStar,
    )

    const { criterion: criterionA } = makeRatingCriterion({ name: 'Originalidade e inovação' })
    const { criterion: criterionB } = makeRatingCriterion({ name: 'Rigor metodológico e qualidade técnica' })
    projectTeacherRatingsRepository.criterionNames.set(criterionA.id.toString(), criterionA.name)
    projectTeacherRatingsRepository.criterionNames.set(criterionB.id.toString(), criterionB.name)

    const ratingId = new UniqueEntityId()
    const { teacherRating } = makeProjectTeacherRating(
      {
        projectId: project.id,
        teacherId: new UniqueEntityId(),
        overallScore: 8,
        items: [
          TeacherRatingItem.create({
            ratingId,
            criterionId: criterionA.id,
            score: 8,
          }),
          TeacherRatingItem.create({
            ratingId,
            criterionId: criterionB.id,
            score: 8,
          }),
        ],
      },
      ratingId,
    )

    projectTeacherRatingsRepository.items.push(teacherRating)

    const result = await sut.execute({ projectId: project.id.toString() })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.rating.starsCount).toBe(2)
      expect(result.value.rating.starsWeightedScore).toBe(6)
      expect(result.value.rating.teacherRatingsCount).toBe(1)
      expect(result.value.rating.teacherAverage).toBe(8)
      expect(result.value.rating.teacherScoresByCriterion).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            criterionId: criterionA.id.toString(),
            criterionName: 'Originalidade e inovação',
            average: 8,
          }),
        ]),
      )
      expect(JSON.stringify(result.value.rating)).not.toContain(teacherRating.teacherId.toString())
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
