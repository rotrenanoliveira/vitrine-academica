import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeFetchApprovedParticipantsController } from '../../factories/event/make-fetch-approved-participants-controller'
import { errorMessageSchema } from '../../schemas/event-schemas'
import { projectListHttpSchema } from '../../schemas/project-schemas'

export async function fetchApprovedParticipantsRoute(app: FastifyInstance) {
  const controller = makeFetchApprovedParticipantsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId/participants',
    {
      schema: {
        tags: ['events'],
        summary: 'Listar participantes aprovados',
        params: z.object({ eventId: z.uuid() }),
        response: {
          200: z.object({ projects: z.array(projectListHttpSchema) }),
          404: errorMessageSchema,
        },
      },
    },
    async (request, reply) => controller.handle({ eventId: request.params.eventId }, reply),
  )
}
