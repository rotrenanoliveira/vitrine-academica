import { makeProject } from '@tests/factories/make-project'
import { makePromotion } from '@tests/factories/make-promotion'
import { makeUser } from '@tests/factories/make-user'
import { InMemoryPointTransactionsRepository } from '@tests/repositories/in-memory-point-transactions-repository'
import { InMemoryProjectsRepository } from '@tests/repositories/in-memory-projects-repository'
import { InMemoryPromotionsRepository } from '@tests/repositories/in-memory-promotions-repository'
import { InMemoryUsersRepository } from '@tests/repositories/in-memory-users-repository'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { type PromotionProps, PromotionStatus } from '../../../enterprise/entities/promotion'
import { ListActivePromotionsUseCase } from './list-active-promotions'

const DAY_IN_MS = 24 * 60 * 60 * 1000

let usersRepository: InMemoryUsersRepository
let projectsRepository: InMemoryProjectsRepository
let promotionsRepository: InMemoryPromotionsRepository
let sut: ListActivePromotionsUseCase

function setupPromotion(
  override: Partial<PromotionProps> = {},
  projectStatus: ProjectStatus = ProjectStatus.PUBLISHED,
) {
  const { user } = makeUser()
  const { project } = makeProject({ status: projectStatus })

  usersRepository.items.push(user)
  projectsRepository.items.push(project)

  const { promotion } = makePromotion({ projectId: project.id, promoterId: user.id, ...override })
  promotionsRepository.items.push(promotion)

  return { user, project, promotion }
}

describe('(UC) - List Active Promotions', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    projectsRepository = new InMemoryProjectsRepository()
    promotionsRepository = new InMemoryPromotionsRepository(new InMemoryPointTransactionsRepository())

    sut = new ListActivePromotionsUseCase(promotionsRepository, projectsRepository, usersRepository)
  })

  it('should return an empty list when there are no promotions', async () => {
    const result = await sut.execute()

    expect(result.isRight()).toBeTruthy()
    expect(result.value.items).toEqual([])
    expect(result.value.total).toBe(0)
    expect(result.value.page).toBe(1)
    expect(result.value.limit).toBe(20)
  })

  it('should list an active promotion with its project and promoter', async () => {
    const { user, project, promotion } = setupPromotion()

    const result = await sut.execute()

    expect(result.value.items).toHaveLength(1)
    expect(result.value.items[0].promotion.id.toString()).toBe(promotion.id.toString())
    expect(result.value.items[0].project.id.toString()).toBe(project.id.toString())
    expect(result.value.items[0].promoter.id.toString()).toBe(user.id.toString())
  })

  it('should not list a promotion whose validity has passed', async () => {
    setupPromotion({ expiresAt: new Date(Date.now() - 1000) })

    const result = await sut.execute()

    expect(result.value.items).toEqual([])
  })

  it('should not list a promotion marked as expired', async () => {
    setupPromotion({ status: PromotionStatus.EXPIRED })

    const result = await sut.execute()

    expect(result.value.items).toEqual([])
  })

  it('should not list a promotion of a project that is not published', async () => {
    setupPromotion({}, ProjectStatus.ARCHIVED)

    const result = await sut.execute()

    expect(result.value.items).toEqual([])
  })
  it('should keep listing an active promotion whose promoter has deleted the account', async () => {
    const { user, promotion } = setupPromotion()

    user.name = 'Conta anonimizada'
    user.status = UserStatus.DELETED

    const result = await sut.execute()

    expect(result.value.items).toHaveLength(1)
    expect(result.value.items[0].promotion.id.toString()).toBe(promotion.id.toString())
    expect(result.value.items[0].promoter.status).toBe(UserStatus.DELETED)
    expect(result.value.items[0].promoter.name).toBe('Conta anonimizada')
  })
  it('should list the newest promotions first', async () => {
    const older = setupPromotion({ createdAt: new Date(Date.now() - 2 * DAY_IN_MS) })
    const newer = setupPromotion({ createdAt: new Date(Date.now() - DAY_IN_MS) })

    const result = await sut.execute()

    expect(result.value.items.map((item) => item.promotion.id.toString())).toEqual([
      newer.promotion.id.toString(),
      older.promotion.id.toString(),
    ])
  })

  it('should use the informed date to decide which promotions are active', async () => {
    setupPromotion({ expiresAt: new Date(Date.now() + 3 * DAY_IN_MS) })

    const result = await sut.execute({ now: new Date(Date.now() + 5 * DAY_IN_MS) })

    expect(result.value.items).toEqual([])
  })

  it('should keep only the newest promotion when the same project is promoted twice', async () => {
    const { user: olderPromoter } = makeUser()
    const { user: newerPromoter } = makeUser()
    const { project } = makeProject({ status: ProjectStatus.PUBLISHED })

    usersRepository.items.push(olderPromoter, newerPromoter)
    projectsRepository.items.push(project)

    const { promotion: older } = makePromotion({
      projectId: project.id,
      promoterId: olderPromoter.id,
      createdAt: new Date(Date.now() - 2 * DAY_IN_MS),
    })
    const { promotion: newer } = makePromotion({
      projectId: project.id,
      promoterId: newerPromoter.id,
      createdAt: new Date(Date.now() - DAY_IN_MS),
    })

    promotionsRepository.items.push(older, newer)

    const result = await sut.execute()

    expect(result.value.items).toHaveLength(1)
    expect(result.value.total).toBe(1)
    expect(result.value.items[0].promotion.id.toString()).toBe(newer.id.toString())
    expect(result.value.items[0].promoter.id.toString()).toBe(newerPromoter.id.toString())
  })

  it('should paginate unique promoted projects', async () => {
    const first = setupPromotion({ createdAt: new Date(Date.now() - 3 * DAY_IN_MS) })
    const second = setupPromotion({ createdAt: new Date(Date.now() - 2 * DAY_IN_MS) })
    const third = setupPromotion({ createdAt: new Date(Date.now() - DAY_IN_MS) })

    const page1 = await sut.execute({ page: 1, limit: 2 })
    const page2 = await sut.execute({ page: 2, limit: 2 })

    expect(page1.value.total).toBe(3)
    expect(page1.value.page).toBe(1)
    expect(page1.value.limit).toBe(2)
    expect(page1.value.items.map((item) => item.promotion.id.toString())).toEqual([
      third.promotion.id.toString(),
      second.promotion.id.toString(),
    ])
    expect(page2.value.items.map((item) => item.promotion.id.toString())).toEqual([first.promotion.id.toString()])
  })
})
