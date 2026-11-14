import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeListProjectTeacherRatingsController } from '../../factories/project/make-list-project-teacher-ratings-controller'

const criterionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  weight: z.number(),
  active: z.boolean(),
  validFrom: z.iso.datetime(),
  validUntil: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
})

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

export async function listProjectTeacherRatingsRoute(app: FastifyInstance) {
  const listProjectTeacherRatingsController = makeListProjectTeacherRatingsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/:projectId/teacher-ratings',
    {
      schema: {
        tags: ['projects'],
        summary: 'Avaliações docentes do projeto',
        description: 'Lista avaliações docentes do projeto com nome do professor, notas por critério e média geral',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        response: {
          200: z.object({
            criteria: z.array(criterionSchema),
            items: z.array(
              z.object({
                teacher: z.object({
                  id: z.string(),
                  name: z.string(),
                }),
                rating: teacherRatingSchema,
              }),
            ),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return listProjectTeacherRatingsController.handle(
        {
          projectId: request.params.projectId,
        },
        reply,
      )
    },
  )
}
