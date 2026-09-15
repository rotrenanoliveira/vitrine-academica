import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { institutionMembershipRequestSchema, messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeFetchInstitutionMembershipRequestsController } from '../../factories/institution-membership-request/make-fetch-institution-membership-requests-controller'

export async function fetchInstitutionMembershipRequestsRoute(app: FastifyInstance) {
  const fetchInstitutionMembershipRequestsController = makeFetchInstitutionMembershipRequestsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/institutions/:institutionId/membership-requests',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['institutions'],
        summary: 'Listar solicitações de membership',
        description: 'Lista as solicitações de membership da instituição (requer permissão de gestão)',
        params: z.object({
          institutionId: z.uuid().describe('O ID da instituição'),
        }),
        response: {
          200: z.object({
            requests: z.array(institutionMembershipRequestSchema),
          }),
          401: messageSchema,
          403: messageSchema,
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return fetchInstitutionMembershipRequestsController.handle(
        {
          institutionId: request.params.institutionId,
          actorId: request.user.sub,
        },
        reply,
      )
    },
  )
}
