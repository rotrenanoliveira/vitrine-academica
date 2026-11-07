import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { EventPhase } from '@/domain/event/enterprise/entities/event'
import { makeFetchInstitutionEventsController } from '../../factories/event/make-fetch-institution-events-controller'
import { errorMessageSchema, eventHttpSchema, eventPhaseSchema } from '../../schemas/event-schemas'

export async function fetchInstitutionEventsRoute(app: FastifyInstance) {
  const controller = makeFetchInstitutionEventsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/institutions/:institutionId/events',
    {
      schema: {
        tags: ['events'],
        summary: 'Listar eventos da instituição',
        params: z.object({ institutionId: z.uuid() }),
        querystring: z.object({
          page: z.coerce.number().int().min(1).optional(),
          perPage: z.coerce.number().int().min(1).max(100).optional(),
          phase: eventPhaseSchema.optional(),
        }),
        response: {
          200: z.object({ events: z.array(eventHttpSchema) }),
          404: errorMessageSchema,
        },
      },
    },
    async (request, reply) =>
      controller.handle(
        {
          institutionId: request.params.institutionId,
          ...request.query,
          phase: request.query.phase as EventPhase | undefined,
        },
        reply,
      ),
  )
}
