import { makePromotion } from '@tests/factories/make-promotion'
import { InMemoryPointTransactionsRepository } from '@tests/repositories/in-memory-point-transactions-repository'
import { InMemoryPromotionsRepository } from '@tests/repositories/in-memory-promotions-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { PromotionStatus } from '../../../enterprise/entities/promotion'
import { GetFeaturedProjectIdsUseCase } from './get-featured-project-ids'

const DAY_IN_MS = 24 * 60 * 60 * 1000

let promotionsRepository: InMemoryPromotionsRepository
let sut: GetFeaturedProjectIdsUseCase

describe('(UC) - Get Featured Project Ids', () => {
  beforeEach(() => {
    promotionsRepository = new InMemoryPromotionsRepository(new InMemoryPointTransactionsRepository())
    sut = new GetFeaturedProjectIdsUseCase(promotionsRepository)
  })

  it('should return an empty set when no project is informed', async () => {
    const result = await sut.execute({ projectIds: [] })

    expect(result.isRight()).toBeTruthy()
    expect(result.value.featuredProjectIds.size).toBe(0)
  })

  it('should return only the projects that have an active promotion', async () => {
    const promotedId = new UniqueEntityId()
    const regularId = new UniqueEntityId()

    promotionsRepository.items.push(makePromotion({ projectId: promotedId }).promotion)

    const result = await sut.execute({ projectIds: [promotedId.toString(), regularId.toString()] })

    expect(result.value.featuredProjectIds.has(promotedId.toString())).toBe(true)
    expect(result.value.featuredProjectIds.has(regularId.toString())).toBe(false)
  })

  it('should not consider a promotion whose validity has passed', async () => {
    const projectId = new UniqueEntityId()

    promotionsRepository.items.push(makePromotion({ projectId, expiresAt: new Date(Date.now() - 1000) }).promotion)

    const result = await sut.execute({ projectIds: [projectId.toString()] })

    expect(result.value.featuredProjectIds.size).toBe(0)
  })

  it('should not consider a promotion marked as expired', async () => {
    const projectId = new UniqueEntityId()

    promotionsRepository.items.push(makePromotion({ projectId, status: PromotionStatus.EXPIRED }).promotion)

    const result = await sut.execute({ projectIds: [projectId.toString()] })

    expect(result.value.featuredProjectIds.size).toBe(0)
  })

  it('should return the project only once when it has more than one active promotion', async () => {
    const projectId = new UniqueEntityId()

    promotionsRepository.items.push(makePromotion({ projectId }).promotion, makePromotion({ projectId }).promotion)

    const result = await sut.execute({ projectIds: [projectId.toString()] })

    expect(result.value.featuredProjectIds.size).toBe(1)
  })

  it('should only look at the informed projects', async () => {
    const informedId = new UniqueEntityId()

    promotionsRepository.items.push(makePromotion().promotion)

    const result = await sut.execute({ projectIds: [informedId.toString()] })

    expect(result.value.featuredProjectIds.size).toBe(0)
  })

  it('should use the informed date to decide which promotions are active', async () => {
    const projectId = new UniqueEntityId()

    promotionsRepository.items.push(
      makePromotion({ projectId, expiresAt: new Date(Date.now() + 3 * DAY_IN_MS) }).promotion,
    )

    const result = await sut.execute({
      projectIds: [projectId.toString()],
      now: new Date(Date.now() + 5 * DAY_IN_MS),
    })

    expect(result.value.featuredProjectIds.size).toBe(0)
  })
})
