import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeDeactivatePreferenceTagController } from '../../factories/preference-tag/make-deactivate-preference-tag-controller'

export async function deactivatePreferenceTagRoute(app: FastifyInstance) {
  const deactivatePreferenceTagController = makeDeactivatePreferenceTagController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/preference-tags/:tagId/deactivate',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['preference-tags'],
        summary: 'Desativar uma tag de preferência',
        description:
          'Desativa uma tag de interesse do usuário autenticado. Para ativar de novo, basta cadastrá-la novamente.',
        params: z.object({
          tagId: z.uuid().describe('O ID da tag'),
        }),
        response: {
          200: z.object({
            preferenceTag: z.object({
              id: z.string(),
              tagId: z.string(),
              userId: z.string(),
              status: z.enum(['ACTIVE', 'INACTIVE']),
              createdAt: z.iso.datetime(),
            }),
          }),
          400: z.object({
            message: z.string(),
          }),
          401: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return deactivatePreferenceTagController.handle({ userId: request.user.sub, tagId: request.params.tagId }, reply)
    },
  )
}
