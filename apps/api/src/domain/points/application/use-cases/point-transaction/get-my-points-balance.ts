import { type Either, right } from '@/core/either'
import type { PointTransactionsRepository } from '../../repositories/point-transactions-repository'

interface GetMyPointsBalanceUseCaseRequest {
  userId: string
}

type GetMyPointsBalanceUseCaseResponse = Either<never, { balance: number }>

export class GetMyPointsBalanceUseCase {
  constructor(private readonly pointTransactionsRepository: PointTransactionsRepository) {}

  async execute({ userId }: GetMyPointsBalanceUseCaseRequest): Promise<GetMyPointsBalanceUseCaseResponse> {
    const balance = await this.pointTransactionsRepository.getBalanceByUserId(userId)

    return right({ balance })
  }
}
