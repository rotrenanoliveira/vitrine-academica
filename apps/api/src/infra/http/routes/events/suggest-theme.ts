import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeSuggestThemeController } from '../../factories/event/make-suggest-theme-controller'
import { errorMessageSchema, themeHttpSchema } from '../../schemas/event-schemas'

export async function suggestThemeRoute(app: FastifyInstance) {
  const controller = makeSuggestThemeController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/events/:eventId/themes',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['events'],
        summary: 'Sugerir tema',
        params: z.object({ eventId: z.uuid() }),
        body: z.object({
          title: z.string().min(1),
          description: z.string().min(1),
        }),
        response: {
          201: z.object({ theme: themeHttpSchema }),
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
          authorId: request.user.sub,
          title: request.body.title,
          description: request.body.description,
        },
        reply,
      ),
  )
}
