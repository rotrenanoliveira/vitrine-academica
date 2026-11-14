import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { callApplicationWithCallSchema } from '@/utils/call-application-schemas'
import { messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeFetchMyCallApplicationsController } from '../../factories/call-application/make-fetch-my-call-applications-controller'

export async function fetchMyCallApplicationsRoute(app: FastifyInstance) {
  const fetchMyCallApplicationsController = makeFetchMyCallApplicationsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/calls/me/applications',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['call-applications'],
        summary: 'Listar minhas candidaturas',
        description:
          'Lista as candidaturas do usuário autenticado, da mais recente à mais antiga, com o chamado de cada uma',
        response: {
          200: z.object({
            applications: z.array(callApplicationWithCallSchema),
          }),
          401: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return fetchMyCallApplicationsController.handle({ applicantId: request.user.sub }, reply)
    },
  )
}
