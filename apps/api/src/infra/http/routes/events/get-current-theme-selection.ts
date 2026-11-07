import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeGetCurrentThemeSelectionController } from '../../factories/event/make-get-current-theme-selection-controller'
import { errorMessageSchema, eventHttpSchema, themeHttpSchema } from '../../schemas/event-schemas'

export async function getCurrentThemeSelectionRoute(app: FastifyInstance) {
  const controller = makeGetCurrentThemeSelectionController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId/theme-selection',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['events'],
        summary: 'Consultar escolha de tema corrente',
        params: z.object({ eventId: z.string().min(1) }),
        response: {
          200: z.object({ event: eventHttpSchema, themes: z.array(themeHttpSchema) }),
          403: errorMessageSchema,
          404: errorMessageSchema,
        },
      },
    },
    async (request, reply) => controller.handle({ eventId: request.params.eventId, userId: request.user.sub }, reply),
  )
}
