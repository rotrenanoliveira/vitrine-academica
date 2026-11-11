import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeFetchPublishedProjectsTodayController } from '../../factories/project/make-fetch-published-projects-today-controller'
import { projectListHttpSchema } from '../../schemas/project-schemas'

export async function fetchPublishedProjectsTodayRoute(app: FastifyInstance) {
  const fetchPublishedProjectsTodayController = makeFetchPublishedProjectsTodayController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/published/today',
    {
      schema: {
        tags: ['projects'],
        summary: 'Listar projetos publicados hoje',
        description: 'Lista projetos com status PUBLISHED lançados no dia atual (UTC)',
        response: {
          200: z.object({
            total: z.number(),
            projects: z.array(projectListHttpSchema),
          }),
        },
      },
    },
    async (_request, reply) => {
      return fetchPublishedProjectsTodayController.handle(reply)
    },
  )
}
