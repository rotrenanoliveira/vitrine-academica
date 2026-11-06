import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeSelectInstitutionalThemeController } from '../../factories/event/make-select-institutional-theme-controller'
import { errorMessageSchema, eventHttpSchema } from '../../schemas/event-schemas'

export async function selectInstitutionalThemeRoute(app: FastifyInstance) {
  const controller = makeSelectInstitutionalThemeController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/events/:eventId/select-theme',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['events'],
        summary: 'Selecionar tema institucional',
        params: z.object({ eventId: z.uuid() }),
        body: z.object({ themeId: z.uuid() }),
        response: {
          200: z.object({ event: eventHttpSchema }),
          403: errorMessageSchema,
          404: errorMessageSchema,
          409: errorMessageSchema,
        },
      },
    },
    async (request, reply) =>
      controller.handle(
        {
          eventId: request.params.eventId,
          themeId: request.body.themeId,
          actorId: request.user.sub,
        },
        reply,
      ),
  )
}
