import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makePublishScheduledProjectsController } from '../../factories/project/make-publish-scheduled-projects-controller'

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
            projects: z.array(projectSchema),
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
