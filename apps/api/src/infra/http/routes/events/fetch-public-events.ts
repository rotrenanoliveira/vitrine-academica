import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { EventPhase } from '@/domain/event/enterprise/entities/event'
import { makeFetchPublicEventsController } from '../../factories/event/make-fetch-public-events-controller'
import { eventHttpSchema, eventPhaseSchema } from '../../schemas/event-schemas'

export async function fetchPublicEventsRoute(app: FastifyInstance) {
  const controller = makeFetchPublicEventsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/events',
    {
      schema: {
        tags: ['events'],
        summary: 'Listar eventos públicos',
        querystring: z.object({
          page: z.coerce.number().int().min(1).optional(),
          perPage: z.coerce.number().int().min(1).max(100).optional(),
          institutionId: z.uuid().optional(),
          phase: eventPhaseSchema.optional(),
        }),
        response: { 200: z.object({ events: z.array(eventHttpSchema) }) },
      },
    },
    async (request, reply) =>
      controller.handle(
        {
          ...request.query,
          phase: request.query.phase as EventPhase | undefined,
        },
        reply,
      ),
  )
}
