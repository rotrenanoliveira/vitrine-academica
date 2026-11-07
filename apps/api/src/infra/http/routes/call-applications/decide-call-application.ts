import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { callApplicationSchema } from '@/utils/call-application-schemas'
import { messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeDecideCallApplicationController } from '../../factories/call-application/make-decide-call-application-controller'

export async function decideCallApplicationRoute(app: FastifyInstance) {
  const decideCallApplicationController = makeDecideCallApplicationController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/calls/:callId/applications/:applicationId/decision',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['call-applications'],
        summary: 'Aprovar ou rejeitar uma candidatura',
        description:
          'Registra a decisão do autor sobre uma candidatura pendente e avisa o candidato por e-mail. O campo notified indica se o e-mail foi enviado',
        params: z.object({
          callId: z.uuid().describe('O ID do chamado'),
          applicationId: z.uuid().describe('O ID da candidatura'),
        }),
        body: z.object({
          decision: z.enum(['APPROVED', 'REJECTED']).describe('A decisão sobre a candidatura'),
        }),
        response: {
          200: z.object({
            application: callApplicationSchema,
            notified: z.boolean(),
          }),
          401: messageSchema,
          403: messageSchema,
          404: messageSchema,
          409: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return decideCallApplicationController.handle(
        {
          callId: request.params.callId,
          applicationId: request.params.applicationId,
          authorId: request.user.sub,
        },
        request.body,
        reply,
      )
    },
  )
}
