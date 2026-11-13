import type { FastifyReply } from 'fastify'
import type { GetMyPointsBalanceUseCase } from '@/domain/points/application/use-cases/point-transaction/get-my-points-balance'

interface GetMyPointsBalanceParams {
  userId: string
}

export class GetMyPointsBalanceController {
  constructor(private readonly getMyPointsBalance: GetMyPointsBalanceUseCase) {}

  async handle({ userId }: GetMyPointsBalanceParams, reply: FastifyReply) {
    const result = await this.getMyPointsBalance.execute({ userId })

    return reply.status(200).send({ balance: result.value.balance })
  }
}
