import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeFetchPublishedProjectsController } from '../../factories/project/make-fetch-published-projects-controller'
import { projectHttpSchema } from '../../schemas/project-schemas'

export async function fetchPublishedProjectsRoute(app: FastifyInstance) {
  const fetchPublishedProjectsController = makeFetchPublishedProjectsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/published',
    {
      schema: {
        tags: ['projects'],
        summary: 'Listar projetos publicados',
        description: 'Lista todos os projetos com status PUBLISHED',
        response: {
          200: z.object({
            projects: z.array(projectHttpSchema),
          }),
        },
      },
    },
    async (_request, reply) => {
      return fetchPublishedProjectsController.handle(reply)
    },
  )
}
