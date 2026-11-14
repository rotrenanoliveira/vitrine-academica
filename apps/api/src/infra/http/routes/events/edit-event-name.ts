import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeEditEventNameController } from '../../factories/event/make-edit-event-name-controller'
import { errorMessageSchema, eventHttpSchema } from '../../schemas/event-schemas'

export async function editEventNameRoute(app: FastifyInstance) {
  const controller = makeEditEventNameController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().patch(
    '/events/:eventId',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['events'],
        summary: 'Editar nome do evento',
        params: z.object({ eventId: z.uuid() }),
        body: z.object({ name: z.string().min(1) }),
        response: {
          200: z.object({ event: eventHttpSchema }),
          403: errorMessageSchema,
          404: errorMessageSchema,
        },
      },
    },
    async (request, reply) =>
      controller.handle(
        {
          eventId: request.params.eventId,
          actorId: request.user.sub,
          name: request.body.name,
        },
        reply,
      ),
  )
}
