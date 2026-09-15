import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeFetchProjectsOfInterestController } from '../../factories/project-tag/make-fetch-projects-of-interest-controller'

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

export async function fetchProjectsOfInterestRoute(app: FastifyInstance) {
  const fetchProjectsOfInterestController = makeFetchProjectsOfInterestController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/users/:userId/projects-of-interest',
    {
      schema: {
        tags: ['project-tags'],
        summary: 'Buscar projetos de interesse do usuário',
        description: 'Lista projetos relacionados às tags de preferência ativas do usuário',
        params: z.object({
          userId: z.uuid().describe('O ID do usuário'),
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
      return fetchProjectsOfInterestController.handle(request.params, reply)
    },
  )
}
