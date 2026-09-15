import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { institutionMemberSchema, messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeFetchInstitutionMembersController } from '../../factories/institution-member/make-fetch-institution-members-controller'

export async function fetchInstitutionMembersRoute(app: FastifyInstance) {
  const fetchInstitutionMembersController = makeFetchInstitutionMembersController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/institutions/:institutionId/members',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['institutions'],
        summary: 'Listar membros da instituição',
        description: 'Lista os membros de uma instituição (requer permissão de gestão)',
        params: z.object({
          institutionId: z.uuid().describe('O ID da instituição'),
        }),
        response: {
          200: z.object({
            members: z.array(institutionMemberSchema),
          }),
          401: messageSchema,
          403: messageSchema,
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return fetchInstitutionMembersController.handle(
        {
          institutionId: request.params.institutionId,
          actorId: request.user.sub,
        },
        reply,
      )
    },
  )
}
