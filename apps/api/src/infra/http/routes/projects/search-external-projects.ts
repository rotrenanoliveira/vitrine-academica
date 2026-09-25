import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeSearchExternalProjectsController } from '../../factories/project/make-search-external-projects-controller'

const externalProjectSchema = z.object({
  title: z.string(),
  authors: z.array(z.string()),
  externalUrl: z.string(),
  publishedIn: z.string(),
  abstract: z.string().optional(),
})
export async function searchExternalProjectsRoute(app: FastifyInstance) {
  const searchExternalProjectsController = makeSearchExternalProjectsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/external-search',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Buscar trabalhos acadêmicos externos',
        description: 'Busca trabalhos científicos na OpenAlex.',
        querystring: z.object({
          q: z.string().trim().min(3).max(200).describe('Termo de busca'),
        }),
        response: {
          200: z.object({ projects: z.array(externalProjectSchema) }),
          401: z.object({ message: z.string() }),
          502: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      return searchExternalProjectsController.handle({ query: request.query.q }, reply)
    },
  )
}
