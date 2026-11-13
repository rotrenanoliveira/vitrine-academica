import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { messageSchema } from '@/utils/institution-schemas'
import { promotionSchema } from '@/utils/point-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makePromoteProjectController } from '../../factories/points/make-promote-project-controller'

export async function promoteProjectRoute(app: FastifyInstance) {
  const promoteProjectController = makePromoteProjectController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/projects/:projectId/promotions',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['points'],
        summary: 'Promover projeto',
        description:
          'Promove um projeto publicado de outra pessoa gastando pontos do usuário autenticado. O débito e a promoção são gravados juntos. A mesma pessoa não pode ter duas promoções ativas no mesmo projeto. Erros: 400 (projeto não publicado), 403 (próprio projeto ou usuário inativo), 404 (projeto inexistente), 409 (saldo insuficiente ou promoção ativa duplicada)',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        response: {
          201: z.object({
            promotion: promotionSchema,
          }),
          400: messageSchema,
          401: messageSchema,
          403: messageSchema,
          404: messageSchema,
          409: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return promoteProjectController.handle(
        {
          projectId: request.params.projectId,
          userId: request.user.sub,
          sessionId: request.user.jti,
        },
        reply,
      )
    },
  )
}
