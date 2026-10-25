import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makePublishProjectController } from '../../factories/project/make-publish-project-controller'

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

export async function publishProjectRoute(app: FastifyInstance) {
  const publishProjectController = makePublishProjectController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/projects/:projectId/publish-now',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Publicar um projeto agora',
        description:
          'Publica imediatamente um projeto em rascunho ou agendado. Se o projeto estava agendado, o agendamento é removido',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        response: {
          200: z.object({
            project: projectSchema,
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
      return publishProjectController.handle(
        {
          projectId: request.params.projectId,
          authorId: request.user.sub,
        },
        reply,
      )
    },
  )
}
