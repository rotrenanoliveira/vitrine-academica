import { makePointTransaction } from '@tests/factories/make-point-transaction'
import { InMemoryPointTransactionsRepository } from '@tests/repositories/in-memory-point-transactions-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { PointTransactionReason, PointTransactionType } from '../../../enterprise/entities/point-transaction'
import { GetMyPointsBalanceUseCase } from './get-my-points-balance'

let pointTransactionsRepository: InMemoryPointTransactionsRepository
let sut: GetMyPointsBalanceUseCase

describe('(UC) - Get My Points Balance', () => {
  beforeEach(() => {
    pointTransactionsRepository = new InMemoryPointTransactionsRepository()
    sut = new GetMyPointsBalanceUseCase(pointTransactionsRepository)
  })

  it('should return zero when the user has no transactions', async () => {
    const result = await sut.execute({ userId: new UniqueEntityId().toString() })

    expect(result.isRight()).toBeTruthy()
    expect(result.value.balance).toBe(0)
  })

  it('should sum credits and subtract debits', async () => {
    const userId = new UniqueEntityId()

    pointTransactionsRepository.items.push(
      makePointTransaction({ userId, type: PointTransactionType.CREDIT, amount: 5 }).pointTransaction,
      makePointTransaction({ userId, type: PointTransactionType.CREDIT, amount: 7 }).pointTransaction,
      makePointTransaction({
        userId,
        type: PointTransactionType.DEBIT,
        amount: 10,
        reason: PointTransactionReason.PROMOTION,
      }).pointTransaction,
    )

    const result = await sut.execute({ userId: userId.toString() })

    expect(result.value.balance).toBe(2)
  })

  it('should ignore transactions from other users', async () => {
    const userId = new UniqueEntityId()

    pointTransactionsRepository.items.push(
      makePointTransaction({ userId, amount: 3 }).pointTransaction,
      makePointTransaction({ amount: 50 }).pointTransaction,
    )

    const result = await sut.execute({ userId: userId.toString() })

    expect(result.value.balance).toBe(3)
  })
})
