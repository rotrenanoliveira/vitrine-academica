import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeListMyTeacherRatingsController } from '../../factories/project/make-list-my-teacher-ratings-controller'

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

export async function listMyTeacherRatingsRoute(app: FastifyInstance) {
  const listMyTeacherRatingsController = makeListMyTeacherRatingsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/me/teacher-ratings',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Projetos que avaliei',
        description: 'Lista os projetos avaliados pelo professor autenticado com breakdown das notas',
        response: {
          200: z.object({
            items: z.array(
              z.object({
                project: projectSchema,
                rating: teacherRatingSchema,
              }),
            ),
          }),
          401: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return listMyTeacherRatingsController.handle(
        {
          teacherId: request.user.sub,
        },
        reply,
      )
    },
  )
}
