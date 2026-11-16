import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeOptionalAuthenticateMiddleware } from '../../factories/auth/make-optional-authenticate-middleware'
import { makeGetCurrentThemeSelectionController } from '../../factories/event/make-get-current-theme-selection-controller'
import { errorMessageSchema, eventHttpSchema, themeHttpSchema } from '../../schemas/event-schemas'

export async function getCurrentThemeSelectionRoute(app: FastifyInstance) {
  const controller = makeGetCurrentThemeSelectionController()
  const optionalAuthenticate = makeOptionalAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId/theme-selection',
    {
      onRequest: [optionalAuthenticate],
      schema: {
        tags: ['events'],
        summary: 'Consultar escolha de tema corrente',
        description:
          'Visitantes e demais usuários recebem o evento e somente temas aprovados. Gestores da instituição recebem todos os temas.',
        params: z.object({ eventId: z.string().min(1) }),
        response: {
          200: z.object({ event: eventHttpSchema, themes: z.array(themeHttpSchema) }),
          401: errorMessageSchema,
          404: errorMessageSchema,
        },
      },
    },
    async (request, reply) =>
      controller.handle(
        {
          eventId: request.params.eventId,
          userId: request.headers.authorization ? request.user.sub : undefined,
        },
        reply,
      ),
  )
}
