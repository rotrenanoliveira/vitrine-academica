import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { SubscriptionStatus } from '@/domain/newsletter/enterprise/entities/author-subscription'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeListMySubscriptionsController } from '../../factories/newsletter/make-list-my-subscriptions-controller'

export async function listMySubscriptionsRoute(app: FastifyInstance) {
  const listMySubscriptionsController = makeListMySubscriptionsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/subscriptions/me',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['newsletter'],
        summary: 'Listar os autores que eu acompanho',
        description: 'Por padrão, só as assinaturas ativas, da mais nova para a mais antiga',
        querystring: z.object({
          status: z.nativeEnum(SubscriptionStatus).optional().describe('Filtra pelo status da assinatura'),
        }),
        response: {
          200: z.object({
            subscriptions: z.array(
              z.object({
                id: z.string(),
                status: z.enum(['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED']),
                subscribedAt: z.iso.datetime(),
                author: z.object({ id: z.string(), name: z.string() }).nullable(),
              }),
            ),
          }),
          401: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      return listMySubscriptionsController.handle({ subscriberId: request.user.sub }, request.query, reply)
    },
  )
}
