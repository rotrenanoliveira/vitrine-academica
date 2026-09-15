import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { institutionMemberSchema, institutionMembershipRequestSchema, messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeApproveInstitutionMembershipRequestController } from '../../factories/institution-membership-request/make-approve-institution-membership-request-controller'

export async function approveInstitutionMembershipRequestRoute(app: FastifyInstance) {
  const approveInstitutionMembershipRequestController = makeApproveInstitutionMembershipRequestController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/institutions/:institutionId/membership-requests/:requestId/approve',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['institutions'],
        summary: 'Aprovar solicitação de membership',
        description: 'Aprova uma solicitação de membership e cria o membro (requer permissão de gestão)',
        params: z.object({
          institutionId: z.uuid().describe('O ID da instituição'),
          requestId: z.uuid().describe('O ID da solicitação'),
        }),
        response: {
          200: z.object({
            request: institutionMembershipRequestSchema,
            member: institutionMemberSchema,
          }),
          401: messageSchema,
          403: messageSchema,
          404: messageSchema,
          409: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return approveInstitutionMembershipRequestController.handle(
        {
          requestId: request.params.requestId,
          actorId: request.user.sub,
        },
        reply,
      )
    },
  )
}
