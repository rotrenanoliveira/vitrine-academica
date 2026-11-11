import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeFetchMyProjectsController } from '../../factories/project/make-fetch-my-projects-controller'
import { projectHttpSchema } from '../../schemas/project-schemas'

export async function fetchMyProjectsRoute(app: FastifyInstance) {
  const fetchMyProjectsController = makeFetchMyProjectsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/me',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Listar meus projetos',
        description: 'Lista os projetos do usuário autenticado',
        querystring: z.object({
          status: z.enum(['SKETCH', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional(),
        }),
        response: {
          200: z.object({
            projects: z.array(projectHttpSchema),
          }),
          401: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return fetchMyProjectsController.handle(
        {
          authorId: request.user.sub,
          status: request.query.status,
        },
        reply,
      )
    },
  )
}
