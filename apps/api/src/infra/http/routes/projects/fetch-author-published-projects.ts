import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeFetchAuthorPublishedProjectsController } from '../../factories/project/make-fetch-author-published-projects-controller'
import { projectListHttpSchema } from '../../schemas/project-schemas'

const messageSchema = z.object({ message: z.string() })

export async function fetchAuthorPublishedProjectsRoute(app: FastifyInstance) {
  const fetchAuthorPublishedProjectsController = makeFetchAuthorPublishedProjectsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/authors/:authorId/projects',
    {
      schema: {
        tags: ['projects'],
        summary: 'Listar projetos publicados de um autor',
        description:
          'Lista todos os projetos PUBLISHED de um autor, do mais recente para o mais antigo, sem filtros. Inclui o nome do autor.',
        params: z.object({
          authorId: z.string().describe('O ID do autor'),
        }),
        response: {
          200: z.object({
            author: z.object({
              id: z.string(),
              name: z.string(),
            }),
            projects: z.array(projectListHttpSchema),
          }),
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return fetchAuthorPublishedProjectsController.handle({ authorId: request.params.authorId }, reply)
    },
  )
}
