import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makePublishScheduledProjectsController } from '../../factories/project/make-publish-scheduled-projects-controller'
import { projectHttpSchema } from '../../schemas/project-schemas'

export async function publishScheduledProjectsRoute(app: FastifyInstance) {
  const publishScheduledProjectsController = makePublishScheduledProjectsController()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/projects/publish-scheduled',
    {
      schema: {
        tags: ['projects'],
        summary: 'Publicar projetos agendados',
        description: 'Publica os projetos agendados cujo horário já chegou, sempre pelo relógio do servidor',
        response: {
          200: z.object({
            projects: z.array(projectHttpSchema),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (_request, reply) => {
      return publishScheduledProjectsController.handle(reply)
    },
  )
}
