import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeGetMyPointsBalanceController } from '../../factories/points/make-get-my-points-balance-controller'

export async function getMyPointsBalanceRoute(app: FastifyInstance) {
  const getMyPointsBalanceController = makeGetMyPointsBalanceController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/points/me',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['points'],
        summary: 'Consultar meu saldo de pontos',
        description: 'Devolve o saldo de pontos do usuário autenticado, calculado pela soma das transações',
        response: {
          200: z.object({
            balance: z.number().int(),
          }),
          401: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return getMyPointsBalanceController.handle({ userId: request.user.sub }, reply)
    },
  )
}
