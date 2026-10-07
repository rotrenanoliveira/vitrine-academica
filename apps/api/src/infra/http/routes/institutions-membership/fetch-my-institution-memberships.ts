import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { institutionMemberSchema, messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeFetchMyInstitutionMembershipsController } from '../../factories/institution-member/make-fetch-my-institution-memberships-controller'

export async function fetchMyInstitutionMembershipsRoute(app: FastifyInstance) {
  const fetchMyInstitutionMembershipsController = makeFetchMyInstitutionMembershipsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/institutions/me',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['institutions'],
        summary: 'Listar minhas memberships',
        description: 'Lista as memberships de instituição do usuário autenticado',
        response: {
          200: z.object({
            members: z.array(institutionMemberSchema),
          }),
          401: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return fetchMyInstitutionMembershipsController.handle(
        {
          userId: request.user.sub,
        },
        reply,
      )
    },
  )
}
