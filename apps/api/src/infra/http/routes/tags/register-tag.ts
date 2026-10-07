import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeRegisterTagController } from '../../factories/tag/make-register-tag-controller'

export async function registerTagRoute(app: FastifyInstance) {
  const registerTagController = makeRegisterTagController()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/tags',
    {
      schema: {
        tags: ['tags'],
        summary: 'Registrar uma nova tag',
        description: 'Registra uma nova tag na aplicação',
        body: z.object({
          name: z.string().min(1).describe('O nome da tag'),
        }),
        response: {
          201: z.object({
            tag: z.object({
              id: z.string(),
              name: z.string(),
              slug: z.string(),
            }),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return registerTagController.handle(request.body, reply)
    },
  )
}
