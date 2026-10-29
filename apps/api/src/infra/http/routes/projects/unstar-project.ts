import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeUnstarProjectController } from '../../factories/project/make-unstar-project-controller'

export async function unstarProjectRoute(app: FastifyInstance) {
  const unstarProjectController = makeUnstarProjectController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().delete(
    '/projects/:projectId/stars',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Remover estrela do projeto',
        description: 'Desativa a estrela ativa do usuário autenticado no projeto',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        response: {
          204: z.null(),
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
      return unstarProjectController.handle(
        {
          projectId: request.params.projectId,
          userId: request.user.sub,
          sessionId: request.user.jti,
        },
        reply,
      )
    },
  )
}
