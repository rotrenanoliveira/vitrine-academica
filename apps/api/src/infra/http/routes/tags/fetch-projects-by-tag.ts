import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeFetchProjectsByTagController } from '../../factories/project-tag/make-fetch-projects-by-tag-controller'

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

export async function fetchProjectsByTagRoute(app: FastifyInstance) {
  const fetchProjectsByTagController = makeFetchProjectsByTagController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/tags/:tagId/projects',
    {
      schema: {
        tags: ['project-tags'],
        summary: 'Listar projetos relacionados a uma tag',
        description: 'Lista todos os projetos vinculados a uma tag',
        params: z.object({
          tagId: z.uuid().describe('O ID da tag'),
        }),
        response: {
          200: z.object({
            projects: z.array(projectSchema),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return fetchProjectsByTagController.handle(request.params, reply)
    },
  )
}
