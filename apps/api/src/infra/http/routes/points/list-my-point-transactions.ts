import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { messageSchema } from '@/utils/institution-schemas'
import { pointTransactionSchema } from '@/utils/point-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeListMyPointTransactionsController } from '../../factories/points/make-list-my-point-transactions-controller'

export async function listMyPointTransactionsRoute(app: FastifyInstance) {
  const listMyPointTransactionsController = makeListMyPointTransactionsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/points/me/transactions',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['points'],
        summary: 'Histórico de pontos',
        description:
          'Lista as transações de pontos do usuário autenticado, da mais recente à mais antiga. Tipo CREDIT soma e DEBIT subtrai do saldo',
        querystring: z.object({
          limit: z.coerce.number().int().min(1).max(100).default(20).describe('Quantidade máxima de transações'),
        }),
        response: {
          200: z.object({
            transactions: z.array(pointTransactionSchema),
          }),
          400: messageSchema,
          401: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return listMyPointTransactionsController.handle({ userId: request.user.sub, limit: request.query.limit }, reply)
    },
  )
}
