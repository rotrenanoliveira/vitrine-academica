import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { institutionSchema, institutionStatusSchema, messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeUpdateInstitutionStatusController } from '../../factories/institution/make-update-institution-status-controller'

export async function updateInstitutionStatusRoute(app: FastifyInstance) {
  const updateInstitutionStatusController = makeUpdateInstitutionStatusController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/institutions/:institutionId/status',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['institutions'],
        summary: 'Atualizar status de uma instituição',
        description: 'Atualiza o status de uma instituição (requer permissão de gestão)',
        params: z.object({
          institutionId: z.uuid().describe('O ID da instituição'),
        }),
        body: z.object({
          status: institutionStatusSchema.describe('O novo status da instituição'),
        }),
        response: {
          200: z.object({
            institution: institutionSchema,
          }),
          401: messageSchema,
          403: messageSchema,
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return updateInstitutionStatusController.handle(
        {
          institutionId: request.params.institutionId,
          actorId: request.user.sub,
        },
        request.body,
        reply,
      )
    },
  )
}
