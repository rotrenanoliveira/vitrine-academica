import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeGetMeController } from '../../factories/auth/make-get-me-controller'

export async function getMeRoute(app: FastifyInstance) {
  const getMeController = makeGetMeController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/auth/me',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Sessão atual',
        description: 'Retorna o usuário autenticado a partir do JWT e da sessão ativa',
        response: {
          200: z.object({
            user: z.object({
              id: z.string(),
              name: z.string(),
              email: z.email(),
              status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED', 'DELETED']),
              accountId: z.string(),
            }),
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
      return getMeController.handle({ userId: request.user.sub }, reply)
    },
  )
}
