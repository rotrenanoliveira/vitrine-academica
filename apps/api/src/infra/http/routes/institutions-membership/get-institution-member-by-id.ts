import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { institutionMemberSchema, messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeGetInstitutionMemberByIdController } from '../../factories/institution-member/make-get-institution-member-by-id-controller'

export async function getInstitutionMemberByIdRoute(app: FastifyInstance) {
  const getInstitutionMemberByIdController = makeGetInstitutionMemberByIdController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/institutions/:institutionId/members/:memberId',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['institutions'],
        summary: 'Buscar membro por ID',
        description: 'Retorna um membro da instituição pelo ID (requer permissão de gestão)',
        params: z.object({
          institutionId: z.uuid().describe('O ID da instituição'),
          memberId: z.uuid().describe('O ID do membro'),
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
      return getInstitutionMemberByIdController.handle(
        {
          memberId: request.params.memberId,
          actorId: request.user.sub,
        },
        reply,
      )
    },
  )
}
