import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeProject } from '@tests/factories/make-project'
import { makeProjectMember } from '@tests/factories/make-project-member'
import { makeProjectStar } from '@tests/factories/make-project-star'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryAuditLogsRepository } from '@tests/repositories/in-memory-audit-logs-repository'
import { InMemoryInstitutionMembersRepository } from '@tests/repositories/in-memory-institution-members-repository'
import { InMemoryPointTransactionsRepository } from '@tests/repositories/in-memory-point-transactions-repository'
import { InMemoryProjectMembersRepository } from '@tests/repositories/in-memory-project-members-repository'
import { InMemoryProjectStarCreditsRepository } from '@tests/repositories/in-memory-project-star-credits-repository'
import { InMemoryProjectStarsRepository } from '@tests/repositories/in-memory-project-stars-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { RegisterLogUseCase } from '@/domain/audit/application/use-cases/audit/register-log'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import {
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'
import { GrantStarPointsUseCase } from '@/domain/points/application/use-cases/point-transaction/grant-star-points'
import { ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import { ProjectStatus } from '../../../enterprise/entities/project'
import { CannotRateOwnProjectError } from '../../_errors/cannot-rate-own-project-error'
import { ProjectNotEligibleForRatingError } from '../../_errors/project-not-eligible-for-rating-error'
import { ProjectNotFoundError } from '../../_errors/project-not-found-error'
import { UserNotActiveError } from '../../_errors/user-not-active-error'
import { StarProjectUseCase } from './star-project'

let projectsRepository: InMemoryProjectsRepository
let projectStarsRepository: InMemoryProjectStarsRepository
let usersRepository: InMemoryUsersRepository
let institutionMembersRepository: InMemoryInstitutionMembersRepository
let projectMembersRepository: InMemoryProjectMembersRepository
let pointTransactionsRepository: InMemoryPointTransactionsRepository
let auditLogsRepository: InMemoryAuditLogsRepository
let sut: StarProjectUseCase

describe('(UC) - Star Project', () => {
  beforeEach(() => {
    projectsRepository = new InMemoryProjectsRepository()
    projectStarsRepository = new InMemoryProjectStarsRepository()
    usersRepository = new InMemoryUsersRepository()
    institutionMembersRepository = new InMemoryInstitutionMembersRepository()
    auditLogsRepository = new InMemoryAuditLogsRepository()

    projectMembersRepository = new InMemoryProjectMembersRepository()
    pointTransactionsRepository = new InMemoryPointTransactionsRepository()

    const registerLog = new RegisterLogUseCase(auditLogsRepository)

    const grantStarPoints = new GrantStarPointsUseCase(
      projectMembersRepository,
      new InMemoryProjectStarCreditsRepository(projectStarsRepository, pointTransactionsRepository),
      registerLog,
    )

    sut = new StarProjectUseCase(
      projectsRepository,
      projectStarsRepository,
      usersRepository,
      institutionMembersRepository,
      grantStarPoints,
      registerLog,
    )
  })

  it('should be able to star a published project with weight 1', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    usersRepository.items.push(user)
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      userId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.projectStar.weight).toBe(1)
      expect(result.value.projectStar.active).toBe(true)
    }
    expect(projectStarsRepository.items).toHaveLength(1)
  })

  it('should apply weight 5 for active professor membership', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { member } = makeInstitutionMember({
      userId: user.id.toString(),
      role: InstitutionMemberRole.PROFESSOR,
      status: InstitutionMemberStatus.ACTIVE,
    })

    usersRepository.items.push(user)
    projectsRepository.items.push(project)
    institutionMembersRepository.items.push(member)

    const result = await sut.execute({
      projectId: project.id.toString(),
      userId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(result.isRight()).toBeTruthy()
    if (result.isRight()) {
      expect(result.value.projectStar.weight).toBe(5)
    }
  })

  it('should reactivate an inactive star', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { projectStar } = makeProjectStar({
      projectId: project.id,
      userId: user.id,
      active: false,
      weight: 1,
    })

    usersRepository.items.push(user)
    projectsRepository.items.push(project)
    projectStarsRepository.items.push(projectStar)

    const result = await sut.execute({
      projectId: project.id.toString(),
      userId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(result.isRight()).toBeTruthy()
    expect(projectStar.active).toBe(true)
    expect(projectStarsRepository.items).toHaveLength(1)
  })

  it('should not allow starring own project', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({
      status: ProjectStatus.PUBLISHED,
      author: user.id,
    })
    usersRepository.items.push(user)
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      userId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CannotRateOwnProjectError)
    }
  })

  it('should not allow starring a non-published project', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.SKETCH })
    usersRepository.items.push(user)
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      userId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotEligibleForRatingError)
    }
  })

  it('should not allow starring when project does not exist', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    usersRepository.items.push(user)

    const result = await sut.execute({
      projectId: new UniqueEntityId().toString(),
      userId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProjectNotFoundError)
    }
  })

  it('should not allow starring when user is not active', async () => {
    const { user } = makeUser({ status: UserStatus.BLOCKED })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    usersRepository.items.push(user)
    projectsRepository.items.push(project)

    const result = await sut.execute({
      projectId: project.id.toString(),
      userId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(result.isLeft()).toBeTruthy()
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotActiveError)
    }
  })
  it('should credit the project author with the star weight', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    usersRepository.items.push(user)
    projectsRepository.items.push(project)

    await sut.execute({
      projectId: project.id.toString(),
      userId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(await pointTransactionsRepository.getBalanceByUserId(project.author.toString())).toBe(1)
  })

  it('should credit 5 points to the author when a professor stars the project', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    const { member } = makeInstitutionMember({
      userId: user.id.toString(),
      role: InstitutionMemberRole.PROFESSOR,
      status: InstitutionMemberStatus.ACTIVE,
    })

    usersRepository.items.push(user)
    projectsRepository.items.push(project)
    institutionMembersRepository.items.push(member)

    await sut.execute({
      projectId: project.id.toString(),
      userId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(await pointTransactionsRepository.getBalanceByUserId(project.author.toString())).toBe(5)
  })

  it('should credit the accepted co-authors of the project', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    const coauthorId = new UniqueEntityId()

    usersRepository.items.push(user)
    projectsRepository.items.push(project)
    projectMembersRepository.items.push(
      makeProjectMember({
        projectId: project.id,
        userId: coauthorId,
        status: ProjectMemberStatus.ACCEPTED,
      }).projectMember,
    )

    await sut.execute({
      projectId: project.id.toString(),
      userId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(await pointTransactionsRepository.getBalanceByUserId(coauthorId.toString())).toBe(1)
  })

  it('should credit only once when the star is removed and given again', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    usersRepository.items.push(user)
    projectsRepository.items.push(project)

    const request = {
      projectId: project.id.toString(),
      userId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
    }

    await sut.execute(request)
    projectStarsRepository.items[0].deactivate()
    await sut.execute(request)

    expect(projectStarsRepository.items[0].active).toBe(true)
    expect(pointTransactionsRepository.items).toHaveLength(1)
    expect(await pointTransactionsRepository.getBalanceByUserId(project.author.toString())).toBe(1)
  })

  it('should not credit again when the star is already active', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })
    usersRepository.items.push(user)
    projectsRepository.items.push(project)

    const request = {
      projectId: project.id.toString(),
      userId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
    }

    await sut.execute(request)
    await sut.execute(request)

    expect(pointTransactionsRepository.items).toHaveLength(1)
  })

  it('should not credit anything when the star is refused', async () => {
    const { user } = makeUser({ status: UserStatus.ACTIVE })
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED, author: user.id })
    usersRepository.items.push(user)
    projectsRepository.items.push(project)

    await sut.execute({
      projectId: project.id.toString(),
      userId: user.id.toString(),
      sessionId: new UniqueEntityId().toString(),
    })

    expect(pointTransactionsRepository.items).toHaveLength(0)
  })
})
