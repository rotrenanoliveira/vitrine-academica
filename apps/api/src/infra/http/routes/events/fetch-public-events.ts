import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { EventPhase, ParticipationScope } from '@/domain/event/enterprise/entities/event'
import { makeFetchPublicEventsController } from '../../factories/event/make-fetch-public-events-controller'
import { eventListItemHttpSchema, eventPhaseSchema, participationScopeSchema } from '../../schemas/event-schemas'

function toArray<T>(value?: T | T[]): T[] | undefined {
  if (value === undefined) return undefined
  return Array.isArray(value) ? value : [value]
}

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
          institutionIds: z.union([z.uuid(), z.array(z.uuid())]).optional(),
          phase: z.union([eventPhaseSchema, z.array(eventPhaseSchema)]).optional(),
          participationScope: participationScopeSchema.optional(),
        }),
        response: {
          200: z.object({
            events: z.array(eventListItemHttpSchema),
            total: z.number().int(),
            page: z.number().int().min(1),
            perPage: z.number().int().min(1),
          }),
        },
      },
    },
    async (request, reply) =>
      controller.handle(
        {
          page: request.query.page,
          perPage: request.query.perPage,
          institutionIds: toArray(request.query.institutionIds),
          phases: toArray(request.query.phase) as EventPhase[] | undefined,
          participationScope: request.query.participationScope as ParticipationScope | undefined,
        },
        reply,
      ),
  )
}
