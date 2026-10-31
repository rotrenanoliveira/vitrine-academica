import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeRateProjectByCriteriaController } from '../../factories/project/make-rate-project-by-criteria-controller'

const teacherRatingSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  teacherId: z.string(),
  overallScore: z.number(),
  ratedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  items: z.array(
    z.object({
      id: z.string(),
      criterionId: z.string(),
      score: z.number(),
    }),
  ),
})

export async function rateProjectByCriteriaRoute(app: FastifyInstance) {
  const rateProjectByCriteriaController = makeRateProjectByCriteriaController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().put(
    '/projects/:projectId/teacher-ratings',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Avaliar projeto por critérios docentes',
        description: 'Cria ou atualiza a avaliação docente com notas 0–10 nos 4 critérios ativos',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        body: z.object({
          scores: z
            .array(
              z.object({
                criterionId: z.uuid(),
                score: z.number().min(0).max(10),
              }),
            )
            .min(1),
        }),
        response: {
          200: z.object({
            rating: teacherRatingSchema,
          }),
          201: z.object({
            rating: teacherRatingSchema,
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
      return rateProjectByCriteriaController.handle(
        {
          projectId: request.params.projectId,
          teacherId: request.user.sub,
          sessionId: request.user.jti,
          scores: request.body.scores,
        },
        reply,
      )
    },
  )
}
