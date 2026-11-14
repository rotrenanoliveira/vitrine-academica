import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeGetMyTeacherRatingOnProjectController } from '../../factories/project/make-get-my-teacher-rating-on-project-controller'

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

export async function getMyTeacherRatingOnProjectRoute(app: FastifyInstance) {
  const getMyTeacherRatingOnProjectController = makeGetMyTeacherRatingOnProjectController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/:projectId/teacher-ratings/me',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Minha avaliação docente neste projeto',
        description: 'Retorna a avaliação docente do usuário autenticado no projeto, se existir',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        response: {
          200: z.object({
            teacherRating: teacherRatingSchema.nullable(),
          }),
          401: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return getMyTeacherRatingOnProjectController.handle(
        {
          projectId: request.params.projectId,
          teacherId: request.user.sub,
        },
        reply,
      )
    },
  )
}
