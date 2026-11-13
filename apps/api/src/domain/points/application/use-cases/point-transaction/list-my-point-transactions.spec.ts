import { makePointTransaction } from '@tests/factories/make-point-transaction'
import { InMemoryPointTransactionsRepository } from '@tests/repositories/in-memory-point-transactions-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ListMyPointTransactionsUseCase } from './list-my-point-transactions'

let pointTransactionsRepository: InMemoryPointTransactionsRepository
let sut: ListMyPointTransactionsUseCase

describe('(UC) - List My Point Transactions', () => {
  beforeEach(() => {
    pointTransactionsRepository = new InMemoryPointTransactionsRepository()
    sut = new ListMyPointTransactionsUseCase(pointTransactionsRepository)
  })

  it('should return an empty list when the user has no transactions', async () => {
    const result = await sut.execute({ userId: new UniqueEntityId().toString(), limit: 20 })

    expect(result.isRight()).toBeTruthy()
    expect(result.value.transactions).toEqual([])
  })

  it('should list the transactions from the newest to the oldest', async () => {
    const userId = new UniqueEntityId()

    const oldest = makePointTransaction({ userId, createdAt: new Date('2026-01-01T10:00:00Z') }).pointTransaction
    const newest = makePointTransaction({ userId, createdAt: new Date('2026-01-03T10:00:00Z') }).pointTransaction
    const middle = makePointTransaction({ userId, createdAt: new Date('2026-01-02T10:00:00Z') }).pointTransaction

    pointTransactionsRepository.items.push(oldest, newest, middle)

    const result = await sut.execute({ userId: userId.toString(), limit: 20 })

    expect(result.value.transactions.map((item) => item.id.toString())).toEqual([
      newest.id.toString(),
      middle.id.toString(),
      oldest.id.toString(),
    ])
  })

  it('should respect the limit', async () => {
    const userId = new UniqueEntityId()

    pointTransactionsRepository.items.push(
      makePointTransaction({ userId, createdAt: new Date('2026-01-01T10:00:00Z') }).pointTransaction,
      makePointTransaction({ userId, createdAt: new Date('2026-01-02T10:00:00Z') }).pointTransaction,
      makePointTransaction({ userId, createdAt: new Date('2026-01-03T10:00:00Z') }).pointTransaction,
    )

    const result = await sut.execute({ userId: userId.toString(), limit: 2 })

    expect(result.value.transactions).toHaveLength(2)
  })

  it('should not list transactions from other users', async () => {
    const userId = new UniqueEntityId()

    pointTransactionsRepository.items.push(
      makePointTransaction({ userId }).pointTransaction,
      makePointTransaction().pointTransaction,
    )

    const result = await sut.execute({ userId: userId.toString(), limit: 20 })

    expect(result.value.transactions).toHaveLength(1)
  })
})
