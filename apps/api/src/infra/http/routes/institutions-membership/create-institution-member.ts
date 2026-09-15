import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { institutionMemberRoleSchema, institutionMemberSchema, messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeCreateInstitutionMemberController } from '../../factories/institution-member/make-create-institution-member-controller'

export async function createInstitutionMemberRoute(app: FastifyInstance) {
  const createInstitutionMemberController = makeCreateInstitutionMemberController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/institutions/:institutionId/members',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['institutions'],
        summary: 'Criar membro de instituição',
        description: 'Adiciona um membro à instituição (requer permissão de gestão)',
        params: z.object({
          institutionId: z.uuid().describe('O ID da instituição'),
        }),
        body: z.object({
          userId: z.uuid().describe('O ID do usuário'),
          role: institutionMemberRoleSchema.describe('O papel do membro'),
        }),
        response: {
          201: z.object({
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
      return createInstitutionMemberController.handle(
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
