import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeModerateThemeController } from '../../factories/event/make-moderate-theme-controller'
import { errorMessageSchema, themeHttpSchema } from '../../schemas/event-schemas'

export async function moderateThemeRoute(app: FastifyInstance) {
  const controller = makeModerateThemeController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().patch(
    '/events/themes/:themeId/moderation',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['events'],
        summary: 'Moderar tema',
        params: z.object({ themeId: z.uuid() }),
        body: z.object({
          action: z.enum(['APPROVE', 'REJECT', 'HIDE']),
          reason: z.string().nullable().optional(),
        }),
        response: {
          200: z.object({ theme: themeHttpSchema }),
          403: errorMessageSchema,
          404: errorMessageSchema,
        },
      },
    },
    async (request, reply) =>
      controller.handle(
        {
          themeId: request.params.themeId,
          actorId: request.user.sub,
          action: request.body.action,
          reason: request.body.reason,
        },
        reply,
      ),
  )
}
