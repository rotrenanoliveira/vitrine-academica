import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { institutionMemberSchema, institutionMemberStatusSchema, messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeUpdateInstitutionMemberStatusController } from '../../factories/institution-member/make-update-institution-member-status-controller'

export async function updateInstitutionMemberStatusRoute(app: FastifyInstance) {
  const updateInstitutionMemberStatusController = makeUpdateInstitutionMemberStatusController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/institutions/:institutionId/members/:memberId/status',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['institutions'],
        summary: 'Atualizar status de membro',
        description: 'Atualiza o status de um membro da instituição (requer permissão de gestão)',
        params: z.object({
          institutionId: z.uuid().describe('O ID da instituição'),
          memberId: z.uuid().describe('O ID do membro'),
        }),
        body: z.object({
          status: institutionMemberStatusSchema.describe('O novo status do membro'),
        }),
        response: {
          200: z.object({
            member: institutionMemberSchema,
          }),
          401: messageSchema,
          403: messageSchema,
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return updateInstitutionMemberStatusController.handle(
        {
          memberId: request.params.memberId,
          actorId: request.user.sub,
        },
        request.body,
        reply,
      )
    },
  )
}
