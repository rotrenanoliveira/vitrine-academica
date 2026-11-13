import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeUnsubscribeFromAuthorController } from '../../factories/newsletter/make-unsubscribe-from-author-controller'

const messageSchema = z.object({ message: z.string() })

export async function unsubscribeFromAuthorRoute(app: FastifyInstance) {
  const unsubscribeFromAuthorController = makeUnsubscribeFromAuthorController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/subscriptions/:subscriptionId/unsubscribe',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['newsletter'],
        summary: 'Cancelar uma assinatura',
        description: 'Só a própria pessoa cancela. Cancelar uma assinatura já cancelada não dá erro',
        params: z.object({
          subscriptionId: z.string().describe('O ID da assinatura'),
        }),
        response: {
          200: z.object({
            subscription: z.object({
              id: z.string(),
              authorId: z.string(),
              status: z.enum(['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED']),
              subscribedAt: z.iso.datetime(),
              unsubscribedAt: z.iso.datetime().nullable(),
            }),
          }),
          401: messageSchema,
          403: messageSchema,
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return unsubscribeFromAuthorController.handle(
        { subscriptionId: request.params.subscriptionId, requesterId: request.user.sub },
        reply,
      )
    },
  )
}
