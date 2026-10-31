import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeListMyStarredProjectsController } from '../../factories/project/make-list-my-starred-projects-controller'

const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  authorId: z.string(),
  status: z.enum(['SKETCH', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']),
  attachments: z.array(z.string()),
  tags: z.array(z.string()),
  createdAt: z.iso.datetime(),
})

const projectStarSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string(),
  weight: z.number().int(),
  active: z.boolean(),
  ratedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
})

export async function listMyStarredProjectsRoute(app: FastifyInstance) {
  const listMyStarredProjectsController = makeListMyStarredProjectsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/me/starred-projects',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Projetos que apoiei',
        description: 'Lista os projetos com estrela ativa do usuário autenticado',
        response: {
          200: z.object({
            items: z.array(
              z.object({
                project: projectSchema,
                star: projectStarSchema,
              }),
            ),
          }),
          401: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return listMyStarredProjectsController.handle(
        {
          userId: request.user.sub,
        },
        reply,
      )
    },
  )
}
