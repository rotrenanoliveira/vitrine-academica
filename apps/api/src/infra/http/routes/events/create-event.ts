import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ParticipationScope } from '@/domain/event/enterprise/entities/event'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeCreateEventController } from '../../factories/event/make-create-event-controller'
import { errorMessageSchema, eventHttpSchema, participationScopeSchema } from '../../schemas/event-schemas'

export async function createEventRoute(app: FastifyInstance) {
  const controller = makeCreateEventController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/institutions/:institutionId/events',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['events'],
        summary: 'Criar ciclo de evento',
        params: z.object({ institutionId: z.uuid() }),
        body: z.object({
          participationScope: participationScopeSchema,
          name: z.string().min(1).nullable().optional(),
        }),
        response: {
          201: z.object({ event: eventHttpSchema }),
          403: errorMessageSchema,
          404: errorMessageSchema,
        },
      },
    },
    async (request, reply) => {
      return controller.handle(
        {
          institutionId: request.params.institutionId,
          actorId: request.user.sub,
          participationScope: request.body.participationScope as ParticipationScope,
          name: request.body.name,
        },
        reply,
      )
    },
  )
}
