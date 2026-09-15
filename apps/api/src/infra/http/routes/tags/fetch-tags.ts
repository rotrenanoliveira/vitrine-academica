import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeFetchTagsController } from '../../factories/tag/make-fetch-tags-controller'

export async function fetchTagsRoute(app: FastifyInstance) {
  const fetchTagsController = makeFetchTagsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/tags',
    {
      schema: {
        tags: ['tags'],
        summary: 'Listar todas as tags',
        description: 'Lista todas as tags cadastradas na aplicação',
        response: {
          200: z.object({
            tags: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                slug: z.string(),
              }),
            ),
          }),
        },
      },
    },
    async (_request, reply) => {
      return fetchTagsController.handle(reply)
    },
  )
}
