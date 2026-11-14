import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeGetMyStarOnProjectController } from '../../factories/project/make-get-my-star-on-project-controller'

const projectStarSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string(),
  weight: z.number().int(),
  active: z.boolean(),
  ratedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
})

export async function getMyStarOnProjectRoute(app: FastifyInstance) {
  const getMyStarOnProjectController = makeGetMyStarOnProjectController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/:projectId/stars/me',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Meu apoio neste projeto',
        description: 'Retorna a estrela ativa do usuário autenticado no projeto, se existir',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        response: {
          200: z.object({
            star: projectStarSchema.nullable(),
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
      return getMyStarOnProjectController.handle(
        {
          projectId: request.params.projectId,
          userId: request.user.sub,
        },
        reply,
      )
    },
  )
}
