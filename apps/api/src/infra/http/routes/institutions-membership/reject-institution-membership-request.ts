import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { institutionMembershipRequestSchema, messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeRejectInstitutionMembershipRequestController } from '../../factories/institution-membership-request/make-reject-institution-membership-request-controller'

export async function rejectInstitutionMembershipRequestRoute(app: FastifyInstance) {
  const rejectInstitutionMembershipRequestController = makeRejectInstitutionMembershipRequestController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/institutions/:institutionId/membership-requests/:requestId/reject',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['institutions'],
        summary: 'Rejeitar solicitação de membership',
        description: 'Rejeita uma solicitação de membership (requer permissão de gestão)',
        params: z.object({
          institutionId: z.uuid().describe('O ID da instituição'),
          requestId: z.uuid().describe('O ID da solicitação'),
        }),
        response: {
          200: z.object({
            request: institutionMembershipRequestSchema,
          }),
          401: messageSchema,
          403: messageSchema,
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return rejectInstitutionMembershipRequestController.handle(
        {
          requestId: request.params.requestId,
          actorId: request.user.sub,
        },
        reply,
      )
    },
  )
}
