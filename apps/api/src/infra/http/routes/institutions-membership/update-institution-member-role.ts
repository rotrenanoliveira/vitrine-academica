import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { institutionMemberRoleSchema, institutionMemberSchema, messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeUpdateInstitutionMemberRoleController } from '../../factories/institution-member/make-update-institution-member-role-controller'

export async function updateInstitutionMemberRoleRoute(app: FastifyInstance) {
  const updateInstitutionMemberRoleController = makeUpdateInstitutionMemberRoleController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/institutions/:institutionId/members/:memberId/role',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['institutions'],
        summary: 'Atualizar cargo de membro',
        description:
          'Atualiza o cargo de um membro da instituição (requer permissão de gestão). Não permite remover o único gerente ativo.',
        params: z.object({
          institutionId: z.uuid().describe('O ID da instituição'),
          memberId: z.uuid().describe('O ID do membro'),
        }),
        body: z.object({
          role: institutionMemberRoleSchema.describe('O novo cargo do membro'),
        }),
        response: {
          200: z.object({
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
      return updateInstitutionMemberRoleController.handle(
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
