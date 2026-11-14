import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeGetProjectByIdController } from '../../factories/project/make-get-project-by-id-controller'
import { projectHttpSchema } from '../../schemas/project-schemas'

export async function getProjectByIdRoute(app: FastifyInstance) {
  const getProjectByIdController = makeGetProjectByIdController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/:projectId',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Obter projeto por ID',
        description: 'Retorna um projeto. Dono vê qualquer status; outros só publicados.',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        response: {
          200: z.object({
            project: projectHttpSchema,
          }),
          401: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return getProjectByIdController.handle(
        {
          projectId: request.params.projectId,
          requesterId: request.user.sub,
        },
        reply,
      )
    },
  )
}
