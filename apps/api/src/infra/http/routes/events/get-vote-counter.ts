import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeGetVoteCounterController } from '../../factories/event/make-get-vote-counter-controller'
import { errorMessageSchema, voteCounterHttpSchema } from '../../schemas/event-schemas'

export async function getVoteCounterRoute(app: FastifyInstance) {
  const controller = makeGetVoteCounterController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId/vote-counter',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['events'],
        summary: 'Consultar contagem de votos',
        params: z.object({ eventId: z.uuid() }),
        response: {
          200: z.object({ counter: z.array(voteCounterHttpSchema) }),
          403: errorMessageSchema,
          404: errorMessageSchema,
        },
      },
    },
    async (request, reply) => controller.handle({ eventId: request.params.eventId, actorId: request.user.sub }, reply),
  )
}
