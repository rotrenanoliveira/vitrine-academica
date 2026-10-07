import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { institutionSchema, messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeEditInstitutionController } from '../../factories/institution/make-edit-institution-controller'

export async function updateInstitutionRoute(app: FastifyInstance) {
  const editInstitutionController = makeEditInstitutionController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().put(
    '/institutions/:institutionId',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['institutions'],
        summary: 'Editar uma instituição',
        description: 'Edita os dados de uma instituição (requer permissão de gestão)',
        params: z.object({
          institutionId: z.uuid().describe('O ID da instituição'),
        }),
        body: z.object({
          name: z.string().min(1).describe('O nome da instituição'),
          description: z.string().min(1).describe('A descrição da instituição'),
          shouldProof: z.boolean().optional().describe('Se exige comprovante para membership'),
          shouldVerify: z.boolean().optional().describe('Se exige verificação'),
          domain: z.string().optional().describe('Domínio de e-mail da instituição'),
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
      return editInstitutionController.handle(
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
