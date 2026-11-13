import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeUnsubscribeByTokenController } from '../../factories/newsletter/make-unsubscribe-by-token-controller'

const messageSchema = z.object({ message: z.string() })

export async function unsubscribeByTokenRoute(app: FastifyInstance) {
  const unsubscribeByTokenController = makeUnsubscribeByTokenController()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/subscriptions/unsubscribe',
    {
      schema: {
        tags: ['newsletter'],
        summary: 'Cancelar uma assinatura pelo link do e-mail',
        description:
          'Rota pública, sem login: o token de 64 caracteres do link identifica a assinatura. Cancelar uma assinatura já cancelada não dá erro',
        body: z.object({
          token: z
            .string()
            .regex(/^[a-f0-9]{64}$/, 'Token inválido')
            .describe('O token do link de cancelamento'),
        }),
        response: {
          200: z.object({ status: z.enum(['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED']) }),
          400: messageSchema,
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return unsubscribeByTokenController.handle(request.body, reply)
    },
  )
}
