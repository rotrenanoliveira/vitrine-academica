import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeFetchPublishedProjectsTodayController } from '../../factories/project/make-fetch-published-projects-today-controller'

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

export async function fetchPublishedProjectsTodayRoute(app: FastifyInstance) {
  const fetchPublishedProjectsTodayController = makeFetchPublishedProjectsTodayController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/published/today',
    {
      schema: {
        tags: ['projects'],
        summary: 'Listar projetos publicados hoje',
        description: 'Lista projetos com status PUBLISHED lançados no dia atual (UTC)',
        response: {
          200: z.object({
            projects: z.array(projectSchema),
          }),
        },
      },
    },
    async (_request, reply) => {
      return fetchPublishedProjectsTodayController.handle(reply)
    },
  )
}
