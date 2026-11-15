import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeFetchMyEventRegistrationsController } from '../../factories/event/make-fetch-my-event-registrations-controller'
import { errorMessageSchema, registrationWithContextHttpSchema } from '../../schemas/event-schemas'

export async function fetchMyEventRegistrationsRoute(app: FastifyInstance) {
  const controller = makeFetchMyEventRegistrationsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/me/registrations',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['events'],
        summary: 'Listar minhas inscrições em eventos',
        description:
          'Lista as inscrições do usuário autenticado, da mais recente à mais antiga, com o evento e o projeto de cada uma',
        response: {
          200: z.object({
            registrations: z.array(registrationWithContextHttpSchema),
          }),
          401: errorMessageSchema,
        },
      },
    },
    async (request, reply) => controller.handle({ userId: request.user.sub }, reply),
  )
}
