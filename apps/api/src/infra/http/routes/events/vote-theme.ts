import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeVoteThemeController } from '../../factories/event/make-vote-theme-controller'
import { errorMessageSchema, voteHttpSchema } from '../../schemas/event-schemas'

export async function voteThemeRoute(app: FastifyInstance) {
  const controller = makeVoteThemeController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/events/:eventId/votes',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['events'],
        summary: 'Votar em tema',
        params: z.object({ eventId: z.uuid() }),
        body: z.object({ themeId: z.uuid() }),
        response: {
          201: z.object({ vote: voteHttpSchema }),
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
          userId: request.user.sub,
        },
        reply,
      ),
  )
}
