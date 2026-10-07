import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeScheduleProjectController } from '../../factories/project/make-schedule-project-controller'

export async function scheduleProjectRoute(app: FastifyInstance) {
  const scheduleProjectController = makeScheduleProjectController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/projects/:projectId/schedule',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Agendar publicação de um projeto',
        description: 'Agenda a publicação de um projeto em rascunho para uma data específica',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        body: z.object({
          publishedIn: z.coerce.date().describe('A data de publicação agendada'),
        }),
        response: {
          201: z.object({
            projectScheduled: z.object({
              id: z.string(),
              projectId: z.string(),
              publishedIn: z.iso.datetime(),
              createdAt: z.iso.datetime(),
            }),
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
          409: z.object({
            message: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return scheduleProjectController.handle(
        {
          projectId: request.params.projectId,
          authorId: request.user.sub,
        },
        request.body,
        reply,
      )
    },
  )
}
