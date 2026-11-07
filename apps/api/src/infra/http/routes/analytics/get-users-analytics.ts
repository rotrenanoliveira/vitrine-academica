import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeGetUsersAnalyticsController } from '../../factories/analytics/make-get-users-analytics-controller'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeAuthorizeMiddleware } from '../../factories/auth/make-authorize-middleware'
import { dailyCountSchema, labelCountSchema, messageSchema, periodQuerySchema } from './analytics-schemas'

export async function getUsersAnalyticsRoute(app: FastifyInstance) {
  const getUsersAnalyticsController = makeGetUsersAnalyticsController()
  const authenticate = makeAuthenticateMiddleware()
  const authorize = makeAuthorizeMiddleware('read', 'Analytics')

  app.withTypeProvider<ZodTypeProvider>().get(
    '/analytics/users',
    {
      onRequest: [authenticate, authorize],
      schema: {
        tags: ['analytics'],
        summary: 'Indicadores de usuários',
        description: 'Retorna usuários por status e novos usuários por dia no período. Apenas administradores',
        querystring: periodQuerySchema,
        response: {
          200: z.object({
            total: z.number().int(),
            createdInPeriod: z.number().int(),
            byStatus: z.array(labelCountSchema),
            createdByDay: z.array(dailyCountSchema),
          }),
          401: messageSchema,
          403: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return getUsersAnalyticsController.handle({ days: request.query.days }, reply)
    },
  )
}
