import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeRegisterProjectInEventController } from '../../factories/event/make-register-project-in-event-controller'
import { errorMessageSchema, registrationHttpSchema } from '../../schemas/event-schemas'

export async function registerProjectInEventRoute(app: FastifyInstance) {
  const controller = makeRegisterProjectInEventController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/events/:eventId/registrations',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['events'],
        summary: 'Inscrever projeto no evento',
        params: z.object({ eventId: z.uuid() }),
        body: z.object({ projectId: z.uuid() }),
        response: {
          201: z.object({ registration: registrationHttpSchema }),
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
          projectId: request.body.projectId,
          userId: request.user.sub,
        },
        reply,
      ),
  )
}
