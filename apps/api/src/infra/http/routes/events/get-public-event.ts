import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeGetPublicEventController } from '../../factories/event/make-get-public-event-controller'
import { errorMessageSchema, eventHttpSchema } from '../../schemas/event-schemas'

export async function getPublicEventRoute(app: FastifyInstance) {
  const controller = makeGetPublicEventController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventIdOrSlug',
    {
      schema: {
        tags: ['events'],
        summary: 'Detalhe público de evento',
        params: z.object({ eventIdOrSlug: z.string().min(1) }),
        response: {
          200: z.object({ event: eventHttpSchema }),
          404: errorMessageSchema,
        },
      },
    },
    async (request, reply) => {
      const value = request.params.eventIdOrSlug
      const isUuid = z.uuid().safeParse(value).success
      return controller.handle(isUuid ? { eventId: value } : { eventSlug: value }, reply)
    },
  )
}
