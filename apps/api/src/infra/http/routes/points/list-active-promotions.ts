import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { messageSchema } from '@/utils/institution-schemas'
import { promotionSchema } from '@/utils/point-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeListActivePromotionsController } from '../../factories/points/make-list-active-promotions-controller'

const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  authorId: z.string(),
  status: z.enum(['SKETCH', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']),
  attachments: z.array(z.string()),
  tags: z.array(z.string()),
  createdAt: z.iso.datetime(),
})

export async function listActivePromotionsRoute(app: FastifyInstance) {
  const listActivePromotionsController = makeListActivePromotionsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/promotions/active',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['points'],
        summary: 'Listar promoções ativas',
        description:
          'Lista as promoções ativas (dentro da validade) de projetos publicados, da mais recente à mais antiga, com o projeto e quem promoveu',
        response: {
          200: z.object({
            items: z.array(
              z.object({
                promotion: promotionSchema,
                project: projectSchema,
                promoter: z.object({
                  id: z.string(),
                  name: z.string(),
                }),
              }),
            ),
          }),
          401: messageSchema,
        },
      },
    },
    async (_request, reply) => {
      return listActivePromotionsController.handle(reply)
    },
  )
}
