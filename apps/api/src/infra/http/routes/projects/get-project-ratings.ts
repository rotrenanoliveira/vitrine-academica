import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeGetProjectRatingsController } from '../../factories/project/make-get-project-ratings-controller'

const projectRatingSchema = z.object({
  projectId: z.string(),
  starsCount: z.number().int(),
  starsWeightedScore: z.number().int(),
  teacherRatingsCount: z.number().int(),
  teacherAverage: z.number().nullable(),
  teacherScoresByCriterion: z.array(
    z.object({
      criterionId: z.string(),
      criterionName: z.string(),
      average: z.number(),
    }),
  ),
})

export async function getProjectRatingsRoute(app: FastifyInstance) {
  const getProjectRatingsController = makeGetProjectRatingsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/:projectId/ratings',
    {
      schema: {
        tags: ['projects'],
        summary: 'Agregados de avaliação do projeto',
        description: 'Retorna contagens e médias públicas do projeto, sem expor avaliadores',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        response: {
          200: z.object({
            rating: projectRatingSchema,
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return getProjectRatingsController.handle(
        {
          projectId: request.params.projectId,
        },
        reply,
      )
    },
  )
}
