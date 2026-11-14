import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeProject } from '@tests/factories/make-project'
import { makeRatingCriterion } from '@tests/factories/make-rating-criterion'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryProjectTeacherRatingsRepository } from '@tests/repositories/in-memory-project-teacher-ratings-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryRatingCriteriaRepository } from '@tests/repositories/in-memory-rating-criteria-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import {
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { CannotRateOwnProjectError } from '../../_errors/cannot-rate-own-project-error'
import { InvalidCriteriaScoresError } from '../../_errors/invalid-criteria-scores-error'
import { TeacherRatingNotAllowedError } from '../../_errors/teacher-rating-not-allowed-error'
import { RateProjectByCriteriaUseCase } from './rate-project-by-criteria'

let projectsRepository: InMemoryProjectsRepository
let ratingsRepository: InMemoryProjectTeacherRatingsRepository
let criteriaRepository: InMemoryRatingCriteriaRepository
let usersRepository: InMemoryUsersRepository
let institutionMembersRepository: InMemoryInstitutionMembersRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: RateProjectByCriteriaUseCase

function seedFourCriteria() {
  const criteria = [
    makeRatingCriterion({ name: 'Originalidade e inovação' }).criterion,
    makeRatingCriterion({ name: 'Rigor metodológico e qualidade técnica' }).criterion,
    makeRatingCriterion({ name: 'Clareza e organização da apresentação' }).criterion,
    makeRatingCriterion({ name: 'Relevância e impacto' }).criterion,
  ]

  criteriaRepository.items.push(...criteria)
  return criteria
}

describe('(UC) - Rate Project By Criteria', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    ratingsRepository = new InMemoryProjectTeacherRatingsRepository()
    criteriaRepository = new InMemoryRatingCriteriaRepository()
    usersRepository = new InMemoryUsersRepository()
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()

    sut = new RateProjectByCriteriaUseCase(
      projectsRepository,
      ratingsRepository,
      criteriaRepository,
      usersRepository,
      institutionMembersRepository,
      new RegisterLogUseCase(auditLogsRepository),
    )
  })

  it('should be able to rate a project', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { member } = makeInstitutionMember({
      userId: user.id.toString(),
      role: InstitutionMemberRole.PROFESSOR,
      status: InstitutionMemberStatus.ACTIVE,
    })
    const criteria = seedFourCriteria()

    usersRepository.items.push(user)
    projectsRepository.items.push(project)
    institutionMembersRepository.items.push(member)

    const scores = [
      { criterionId: criteria[0].id.toString(), score: 8 },
      { criterionId: criteria[1].id.toString(), score: 7 },
      { criterionId: criteria[2].id.toString(), score: 9 },
      { criterionId: criteria[3].id.toString(), score: 8 },
    ]

    const result = await sut.execute({
      projectId: project.id.toString(),
      teacherId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
      scores,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.created).toBe(true)
      expect(result.value.rating.overallScore).toBe(8)
      expect(result.value.rating.items).toHaveLength(4)
    }
  })

  it('should be able to update the project scores', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { member } = makeInstitutionMember({
      userId: user.id.toString(),
      role: InstitutionMemberRole.TEACHER,
      status: InstitutionMemberStatus.ACTIVE,
    })
    const criteria = seedFourCriteria()

    usersRepository.items.push(user)
    projectsRepository.items.push(project)
    institutionMembersRepository.items.push(member)

    const firstScores = criteria.map((criterion) => ({
      criterionId: criterion.id.toString(),
      score: 5,
    }))

    await sut.execute({
      projectId: project.id.toString(),
      teacherId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
      scores: firstScores,
    })

    const secondScores = criteria.map((criterion) => ({
      criterionId: criterion.id.toString(),
      score: 10,
    }))

    const result = await sut.execute({
      projectId: project.id.toString(),
      teacherId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
      scores: secondScores,
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.created).toBe(false)
      expect(result.value.rating.overallScore).toBe(10)
    }
    expect(ratingsRepository.items).toHaveLength(1)
  })

  it('should not be able to rate a project if user is not a teacher', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    const criteria = seedFourCriteria()

    usersRepository.items.push(user)
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      teacherId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
      scores: criteria.map((criterion) => ({ criterionId: criterion.id.toString(), score: 8 })),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(TeacherRatingNotAllowedError)
    }
  })

  it('should not be able to rate if teacher is the owner of the project', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED, author: user.id })
    const { member } = makeInstitutionMember({
      userId: user.id.toString(),
      role: InstitutionMemberRole.PROFESSOR,
      status: InstitutionMemberStatus.ACTIVE,
    })
    const criteria = seedFourCriteria()

    usersRepository.items.push(user)
    projectsRepository.items.push(project)
    institutionMembersRepository.items.push(member)

    const result = await sut.execute({
      projectId: project.id.toString(),
      teacherId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
      scores: criteria.map((criterion) => ({ criterionId: criterion.id.toString(), score: 8 })),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CannotRateOwnProjectError)
    }
  })

  it('should not be able to rate with invalid scores', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { member } = makeInstitutionMember({
      userId: user.id.toString(),
      role: InstitutionMemberRole.PROFESSOR,
      status: InstitutionMemberStatus.ACTIVE,
    })
    const criteria = seedFourCriteria()

    usersRepository.items.push(user)
    projectsRepository.items.push(project)
    institutionMembersRepository.items.push(member)

    const result = await sut.execute({
      projectId: project.id.toString(),
      teacherId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
      scores: [
        { criterionId: criteria[0].id.toString(), score: 11 },
        { criterionId: criteria[1].id.toString(), score: 7 },
        { criterionId: criteria[2].id.toString(), score: 9 },
        { criterionId: criteria[3].id.toString(), score: 8 },
      ],
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCriteriaScoresError)
    }
  })
})
