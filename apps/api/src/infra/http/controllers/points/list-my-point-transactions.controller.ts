import type { FastifyReply } from 'fastify'
import type { ListMyPointTransactionsUseCase } from '@/domain/points/application/use-cases/point-transaction/list-my-point-transactions'
import { PointTransactionPresenter } from '../../presenters/point-transaction-presenter'

interface ListMyPointTransactionsParams {
  userId: string
  limit: number
}

export class ListMyPointTransactionsController {
  constructor(private readonly listMyPointTransactions: ListMyPointTransactionsUseCase) {}

  async handle({ userId, limit }: ListMyPointTransactionsParams, reply: FastifyReply) {
    const result = await this.listMyPointTransactions.execute({ userId, limit })

    return reply.status(200).send({
      transactions: result.value.transactions.map(PointTransactionPresenter.toHTTP),
    })
  }
}
