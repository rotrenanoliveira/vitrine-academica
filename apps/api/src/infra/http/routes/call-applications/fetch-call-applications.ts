import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { callApplicationStatusSchema, callApplicationWithApplicantSchema } from '@/utils/call-application-schemas'
import { messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeFetchCallApplicationsController } from '../../factories/call-application/make-fetch-call-applications-controller'

export async function fetchCallApplicationsRoute(app: FastifyInstance) {
  const fetchCallApplicationsController = makeFetchCallApplicationsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/calls/:callId/applications',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['call-applications'],
        summary: 'Listar candidaturas de um chamado',
        description:
          'Lista as candidaturas do chamado, da mais antiga à mais recente, com nome, instituições e cargo de cada candidato. Somente o autor do chamado tem acesso',
        params: z.object({
          callId: z.uuid().describe('O ID do chamado'),
        }),
        querystring: z.object({
          status: callApplicationStatusSchema.optional().describe('Filtra as candidaturas por status'),
        }),
        response: {
          200: z.object({
            applications: z.array(callApplicationWithApplicantSchema),
          }),
          401: messageSchema,
          403: messageSchema,
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return fetchCallApplicationsController.handle(
        {
          callId: request.params.callId,
          authorId: request.user.sub,
        },
        request.query,
        reply,
      )
    },
  )
}
