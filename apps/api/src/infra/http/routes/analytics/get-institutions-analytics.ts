import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeGetInstitutionsAnalyticsController } from '../../factories/analytics/make-get-institutions-analytics-controller'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeAuthorizeMiddleware } from '../../factories/auth/make-authorize-middleware'
import { labelCountSchema, messageSchema } from './analytics-schemas'

export async function getInstitutionsAnalyticsRoute(app: FastifyInstance) {
  const getInstitutionsAnalyticsController = makeGetInstitutionsAnalyticsController()
  const authenticate = makeAuthenticateMiddleware()
  const authorize = makeAuthorizeMiddleware('read', 'Analytics')

  app.withTypeProvider<ZodTypeProvider>().get(
    '/analytics/institutions',
    {
      onRequest: [authenticate, authorize],
      schema: {
        tags: ['analytics'],
        summary: 'Indicadores de instituições',
        description:
          'Retorna instituições por status, membros ativos por papel e solicitações pendentes. Apenas administradores',
        response: {
          200: z.object({
            total: z.number().int(),
            byStatus: z.array(labelCountSchema),
            membersByRole: z.array(labelCountSchema),
            pendingMembershipRequests: z.number().int(),
          }),
          401: messageSchema,
          403: messageSchema,
        },
      },
    },
    async (_request, reply) => {
      return getInstitutionsAnalyticsController.handle(reply)
    },
  )
}
