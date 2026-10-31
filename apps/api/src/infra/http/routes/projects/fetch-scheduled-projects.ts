import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeFetchScheduledProjectsController } from '../../factories/project/make-fetch-scheduled-projects-controller'

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

export async function fetchScheduledProjectsRoute(app: FastifyInstance) {
  const fetchScheduledProjectsController = makeFetchScheduledProjectsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/scheduled/soon',
    {
      schema: {
        tags: ['projects'],
        summary: 'Listar projetos que serão lançados em breve',
        description:
          'Lista projetos com status SCHEDULED agendados para os próximos 7 dias, do mais próximo ao mais distante',
        response: {
          200: z.object({
            scheduledProjects: z.array(
              z.object({
                project: projectSchema,
                publishedIn: z.iso.datetime(),
              }),
            ),
          }),
        },
      },
    },
    async (_request, reply) => {
      return fetchScheduledProjectsController.handle(reply)
    },
  )
}
