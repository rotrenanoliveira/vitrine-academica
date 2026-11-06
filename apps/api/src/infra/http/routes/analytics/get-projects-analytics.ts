import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeGetProjectsAnalyticsController } from '../../factories/analytics/make-get-projects-analytics-controller'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeAuthorizeMiddleware } from '../../factories/auth/make-authorize-middleware'
import { dailyCountSchema, labelCountSchema, messageSchema, periodQuerySchema } from './analytics-schemas'

export async function getProjectsAnalyticsRoute(app: FastifyInstance) {
  const getProjectsAnalyticsController = makeGetProjectsAnalyticsController()
  const authenticate = makeAuthenticateMiddleware()
  const authorize = makeAuthorizeMiddleware('read', 'Analytics')

  app.withTypeProvider<ZodTypeProvider>().get(
    '/analytics/projects',
    {
      onRequest: [authenticate, authorize],
      schema: {
        tags: ['analytics'],
        summary: 'Indicadores de projetos',
        description: 'Retorna projetos por status e projetos criados por dia no período. Apenas administradores',
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
      return getProjectsAnalyticsController.handle({ days: request.query.days }, reply)
    },
  )
}
