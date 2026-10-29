import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeStarProjectController } from '../../factories/project/make-star-project-controller'

const projectStarSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string(),
  weight: z.number().int(),
  active: z.boolean(),
  ratedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
})

export async function starProjectRoute(app: FastifyInstance) {
  const starProjectController = makeStarProjectController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/projects/:projectId/stars',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Apoiar projeto com estrela',
        description: 'Registra ou reativa uma estrela do usuário autenticado no projeto',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        response: {
          201: z.object({
            projectStar: projectStarSchema,
          }),
          400: z.object({
            message: z.string(),
          }),
          401: z.object({
            message: z.string(),
          }),
          403: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return starProjectController.handle(
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
