import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeGetMyVoteController } from '../../factories/event/make-get-my-vote-controller'
import { errorMessageSchema, voteHttpSchema } from '../../schemas/event-schemas'

export async function getMyVoteRoute(app: FastifyInstance) {
  const controller = makeGetMyVoteController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId/votes/me',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['events'],
        summary: 'Consultar meu voto',
        params: z.object({ eventId: z.uuid() }),
        response: {
          200: z.object({ vote: voteHttpSchema.nullable() }),
          403: errorMessageSchema,
          404: errorMessageSchema,
        },
      },
    },
    async (request, reply) => controller.handle({ eventId: request.params.eventId, userId: request.user.sub }, reply),
  )
}
