import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeGetTagsAnalyticsController } from '../../factories/analytics/make-get-tags-analytics-controller'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeAuthorizeMiddleware } from '../../factories/auth/make-authorize-middleware'
import { messageSchema, tagsQuerySchema } from './analytics-schemas'

export async function getTagsAnalyticsRoute(app: FastifyInstance) {
  const getTagsAnalyticsController = makeGetTagsAnalyticsController()
  const authenticate = makeAuthenticateMiddleware()
  const authorize = makeAuthorizeMiddleware('read', 'Analytics')

  app.withTypeProvider<ZodTypeProvider>().get(
    '/analytics/tags',
    {
      onRequest: [authenticate, authorize],
      schema: {
        tags: ['analytics'],
        summary: 'Tags mais usadas',
        description: 'Retorna as tags mais usadas nos projetos. Apenas administradores',
        querystring: tagsQuerySchema,
        response: {
          200: z.object({
            tags: z.array(
              z.object({
                tagId: z.string(),
                name: z.string(),
                slug: z.string(),
                total: z.number().int(),
              }),
            ),
          }),
          401: messageSchema,
          403: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return getTagsAnalyticsController.handle({ limit: request.query.limit }, reply)
    },
  )
}
