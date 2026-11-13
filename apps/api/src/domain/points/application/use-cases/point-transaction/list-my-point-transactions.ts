import { type Either, right } from '@/core/either'
import type { PointTransaction } from '../../../enterprise/entities/point-transaction'
import type { PointTransactionsRepository } from '../../repositories/point-transactions-repository'

interface ListMyPointTransactionsUseCaseRequest {
  userId: string
  limit: number
}

type ListMyPointTransactionsUseCaseResponse = Either<never, { transactions: PointTransaction[] }>

export class ListMyPointTransactionsUseCase {
  constructor(private readonly pointTransactionsRepository: PointTransactionsRepository) {}

  async execute({
    userId,
    limit,
  }: ListMyPointTransactionsUseCaseRequest): Promise<ListMyPointTransactionsUseCaseResponse> {
    const transactions = await this.pointTransactionsRepository.findManyByUserId(userId, limit)

    return right({ transactions })
  }
}
