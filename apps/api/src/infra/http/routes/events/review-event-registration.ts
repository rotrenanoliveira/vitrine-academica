import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeReviewEventRegistrationController } from '../../factories/event/make-review-event-registration-controller'
import { errorMessageSchema, registrationHttpSchema } from '../../schemas/event-schemas'

export async function reviewEventRegistrationRoute(app: FastifyInstance) {
  const controller = makeReviewEventRegistrationController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().patch(
    '/events/registrations/:registrationId/review',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['events'],
        summary: 'Aprovar ou rejeitar inscrição',
        params: z.object({ registrationId: z.uuid() }),
        body: z.object({
          action: z.enum(['APPROVE', 'REJECT']),
          reason: z.string().nullable().optional(),
        }),
        response: {
          200: z.object({ registration: registrationHttpSchema }),
          403: errorMessageSchema,
          404: errorMessageSchema,
        },
      },
    },
    async (request, reply) =>
      controller.handle(
        {
          registrationId: request.params.registrationId,
          actorId: request.user.sub,
          action: request.body.action,
          reason: request.body.reason,
        },
        reply,
      ),
  )
}
