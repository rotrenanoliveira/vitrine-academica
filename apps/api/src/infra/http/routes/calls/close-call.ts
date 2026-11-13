import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { callSchema } from '@/utils/call-schemas'
import { messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeCloseCallController } from '../../factories/call/make-close-call-controller'

export async function closeCallRoute(app: FastifyInstance) {
  const closeCallController = makeCloseCallController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/calls/:callId/close',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['calls'],
        summary: 'Encerrar chamado',
        description:
          'Encerra um chamado aberto do autor autenticado, que deixa de receber candidaturas, e cria um projeto rascunho com os dados do chamado. O projectId da resposta identifica o projeto criado',
        params: z.object({
          callId: z.uuid().describe('O ID do chamado'),
        }),
        response: {
          200: z.object({
            call: callSchema,
          }),
          401: messageSchema,
          403: messageSchema,
          404: messageSchema,
          409: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return closeCallController.handle(
        {
          callId: request.params.callId,
          authorId: request.user.sub,
        },
        reply,
      )
    },
  )
}
