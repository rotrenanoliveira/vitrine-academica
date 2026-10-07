import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeFetchUserPreferenceTagsController } from '../../factories/preference-tag/make-fetch-user-preference-tags-controller'

export async function fetchUserPreferenceTagsRoute(app: FastifyInstance) {
  const fetchUserPreferenceTagsController = makeFetchUserPreferenceTagsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/users/:userId/preference-tags',
    {
      schema: {
        tags: ['preference-tags'],
        summary: 'Listar tags de preferência de um usuário',
        description: 'Lista todas as tags de preferência cadastradas para um usuário',
        params: z.object({
          userId: z.uuid().describe('O ID do usuário'),
        }),
        response: {
          200: z.object({
            preferenceTags: z.array(
              z.object({
                id: z.string(),
                tagId: z.string(),
                userId: z.string(),
                status: z.enum(['ACTIVE', 'INACTIVE']),
                createdAt: z.iso.datetime(),
              }),
            ),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return fetchUserPreferenceTagsController.handle(request.params, reply)
    },
  )
}
