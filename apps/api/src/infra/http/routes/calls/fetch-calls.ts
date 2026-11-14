import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { callListItemSchema } from '@/utils/call-schemas'
import { messageSchema } from '@/utils/institution-schemas'
import { makeFetchCallsController } from '../../factories/call/make-fetch-calls-controller'

export async function fetchCallsRoute(app: FastifyInstance) {
  const fetchCallsController = makeFetchCallsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/calls',
    {
      schema: {
        tags: ['calls'],
        summary: 'Listar chamados abertos',
        description:
          'Lista os chamados abertos e dentro do prazo, do mais recente ao mais antigo, com filtro opcional por tags. Não exige autenticação',
        querystring: z.object({
          tags: z
            .union([z.uuid(), z.array(z.uuid())])
            .optional()
            .describe('IDs das tags para filtrar os chamados'),
        }),
        response: {
          200: z.object({
            calls: z.array(callListItemSchema),
          }),
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      const tags = request.query.tags
      const tagIds = tags ? (Array.isArray(tags) ? tags : [tags]) : undefined

      return fetchCallsController.handle({ tagIds }, reply)
    },
  )
}
