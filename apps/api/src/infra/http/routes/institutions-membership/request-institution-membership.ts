import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  institutionMembershipRequestRoleSchema,
  institutionMembershipRequestSchema,
  messageSchema,
} from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeRequestInstitutionMembershipController } from '../../factories/institution-membership-request/make-request-institution-membership-controller'

export async function requestInstitutionMembershipRoute(app: FastifyInstance) {
  const requestInstitutionMembershipController = makeRequestInstitutionMembershipController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/institutions/:institutionId/membership-requests',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['institutions'],
        summary: 'Solicitar membership',
        description: 'Cria uma solicitação de membership na instituição',
        params: z.object({
          institutionId: z.uuid().describe('O ID da instituição'),
        }),
        body: z.object({
          role: institutionMembershipRequestRoleSchema.describe('O papel solicitado'),
          proofAttachmentId: z.uuid().optional().describe('ID do anexo de comprovante'),
        }),
        response: {
          201: z.object({
            request: institutionMembershipRequestSchema,
          }),
          400: messageSchema,
          401: messageSchema,
          404: messageSchema,
          409: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return requestInstitutionMembershipController.handle(
        {
          institutionId: request.params.institutionId,
          userId: request.user.sub,
        },
        request.body,
        reply,
      )
    },
  )
}
