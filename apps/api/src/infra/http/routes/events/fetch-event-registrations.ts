import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { EventRegistrationStatus } from '@/domain/event/enterprise/entities/event-registration'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeFetchEventRegistrationsController } from '../../factories/event/make-fetch-event-registrations-controller'
import { errorMessageSchema, registrationHttpSchema } from '../../schemas/event-schemas'
import { projectHttpSchema } from '../../schemas/project-schemas'

export async function fetchEventRegistrationsRoute(app: FastifyInstance) {
  const controller = makeFetchEventRegistrationsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId/registrations',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['events'],
        summary: 'Listar inscrições do evento (gestão)',
        params: z.object({ eventId: z.uuid() }),
        querystring: z.object({
          status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
        }),
        response: {
          200: z.object({
            registrations: z.array(registrationHttpSchema),
            projects: z.array(projectHttpSchema),
          }),
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
          status: request.query.status as EventRegistrationStatus,
        },
        reply,
      ),
  )
}
