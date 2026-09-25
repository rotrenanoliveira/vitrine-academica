import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeSearchExternalProjectsController } from '../../factories/project/make-search-external-projects-controller'

export async function searchExternalProjectsRoute(app: FastifyInstance) {
  const searchExternalProjectsController = makeSearchExternalProjectsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/external-search',
    {
      schema: {
        tags: ['projects'],
        summary: 'Buscar trabalhos acadêmicos externos',
        description: 'Busca trabalhos científicos na OpenAlex.',
        querystring: z.object({
          q: z.string().trim().min(3).max(200).describe('Termo de busca'),
        }),
        response: {
          200: z.object({
            projects: z.array(
              z.object({
                title: z.string(),
                authors: z.array(z.string()),
                externalUrl: z.string(),
                publishedIn: z.string(),
                abstract: z.string().optional(),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      return searchExternalProjectsController.handle({ query: request.query.q }, reply)
    },
  )
}
