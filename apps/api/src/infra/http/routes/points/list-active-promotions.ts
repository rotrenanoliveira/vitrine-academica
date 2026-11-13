import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { messageSchema } from '@/utils/institution-schemas'
import { promotionSchema } from '@/utils/point-schemas'
import { makeListActivePromotionsController } from '../../factories/points/make-list-active-promotions-controller'
import { projectHttpSchema } from '../../schemas/project-schemas'

export async function listActivePromotionsRoute(app: FastifyInstance) {
  const listActivePromotionsController = makeListActivePromotionsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/promotions/active',
    {
      schema: {
        tags: ['points'],
        summary: 'Listar promoções ativas',
        description:
          'Lista promoções ativas (dentro da validade) de projetos publicados, deduplicadas por projeto (promoção mais recente), da mais recente à mais antiga, com paginação',
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(1).describe('Página da listagem'),
          limit: z.coerce.number().int().min(1).max(100).default(20).describe('Quantidade de itens por página'),
        }),
        response: {
          200: z.object({
            items: z.array(
              z.object({
                promotion: promotionSchema,
                project: projectHttpSchema,
                promoter: z.object({
                  id: z.string(),
                  name: z.string(),
                }),
              }),
            ),
            total: z.number().int().min(0),
            page: z.number().int().min(1),
            limit: z.number().int().min(1),
          }),
          401: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return listActivePromotionsController.handle(
        {
          page: request.query.page,
          limit: request.query.limit,
        },
        reply,
      )
    },
  )
}
