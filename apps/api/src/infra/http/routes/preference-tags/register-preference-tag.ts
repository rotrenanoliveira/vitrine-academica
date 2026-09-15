import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeRegisterPreferenceTagController } from '../../factories/preference-tag/make-register-preference-tag-controller'

export async function registerPreferenceTagRoute(app: FastifyInstance) {
  const registerPreferenceTagController = makeRegisterPreferenceTagController()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/preference-tags',
    {
      schema: {
        tags: ['preference-tags'],
        summary: 'Cadastrar uma tag de preferência',
        description: 'Cadastra uma tag de assunto de interesse para um usuário',
        body: z.object({
          userId: z.uuid().describe('O ID do usuário'),
          tagId: z.uuid().describe('O ID da tag'),
        }),
        response: {
          201: z.object({
            preferenceTag: z.object({
              id: z.string(),
              tagId: z.string(),
              userId: z.string(),
              status: z.enum(['ACTIVE', 'INACTIVE']),
              createdAt: z.iso.datetime(),
            }),
          }),
          404: z.object({
            message: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return registerPreferenceTagController.handle(request.body, reply)
    },
  )
}
