import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeFetchApprovedThemesController } from '../../factories/event/make-fetch-approved-themes-controller'
import { errorMessageSchema, themeHttpSchema } from '../../schemas/event-schemas'

export async function fetchApprovedThemesRoute(app: FastifyInstance) {
  const controller = makeFetchApprovedThemesController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId/themes',
    {
      schema: {
        tags: ['events'],
        summary: 'Listar temas aprovados',
        params: z.object({ eventId: z.uuid() }),
        response: {
          200: z.object({ themes: z.array(themeHttpSchema) }),
          404: errorMessageSchema,
        },
      },
    },
    async (request, reply) => controller.handle({ eventId: request.params.eventId }, reply),
  )
}
