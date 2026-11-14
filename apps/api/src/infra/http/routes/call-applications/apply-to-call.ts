import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { callApplicationSchema } from '@/utils/call-application-schemas'
import { messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeApplyToCallController } from '../../factories/call-application/make-apply-to-call-controller'

export async function applyToCallRoute(app: FastifyInstance) {
  const applyToCallController = makeApplyToCallController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/calls/:callId/applications',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['call-applications'],
        summary: 'Candidatar-se a um chamado',
        description:
          'Registra a candidatura do usuário autenticado a um chamado aberto e dentro do prazo, com mensagem de apresentação opcional',
        params: z.object({
          callId: z.uuid().describe('O ID do chamado'),
        }),
        body: z.object({
          message: z.string().max(1000).nullish().describe('Mensagem de apresentação (opcional)'),
        }),
        response: {
          201: z.object({
            application: callApplicationSchema,
          }),
          401: messageSchema,
          403: messageSchema,
          404: messageSchema,
          409: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return applyToCallController.handle(
        {
          callId: request.params.callId,
          applicantId: request.user.sub,
        },
        request.body,
        reply,
      )
    },
  )
}
