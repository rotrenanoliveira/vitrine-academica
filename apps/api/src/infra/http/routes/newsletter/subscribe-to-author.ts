import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeSubscribeToAuthorController } from '../../factories/newsletter/make-subscribe-to-author-controller'

const messageSchema = z.object({ message: z.string() })

export async function subscribeToAuthorRoute(app: FastifyInstance) {
  const subscribeToAuthorController = makeSubscribeToAuthorController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/authors/:authorId/subscriptions',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['newsletter'],
        summary: 'Acompanhar um autor',
        description:
          'A pessoa logada passa a receber um e-mail quando o autor publicar um projeto. Quem cancelou e acompanha de novo reativa a mesma assinatura',
        params: z.object({
          authorId: z.string().describe('O ID do autor'),
        }),
        response: {
          201: z.object({
            subscription: z.object({
              id: z.string(),
              authorId: z.string(),
              status: z.enum(['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED']),
              subscribedAt: z.iso.datetime(),
              unsubscribedAt: z.iso.datetime().nullable(),
            }),
          }),
          400: messageSchema,
          401: messageSchema,
          404: messageSchema,
          409: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return subscribeToAuthorController.handle(
        { authorId: request.params.authorId, subscriberId: request.user.sub },
        reply,
      )
    },
  )
}
