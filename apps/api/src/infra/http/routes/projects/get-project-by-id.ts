import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeGetProjectByIdController } from '../../factories/project/make-get-project-by-id-controller'

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
            project: projectSchema,
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
