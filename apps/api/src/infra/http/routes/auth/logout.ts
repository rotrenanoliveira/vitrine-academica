import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeLogoutController } from '../../factories/auth/make-logout-controller'

export async function logoutRoute(app: FastifyInstance) {
  const logoutController = makeLogoutController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().delete(
    '/auth/sessions',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Encerrar sessão',
        description: 'Revoga a sessão autenticada identificada pelo JWT (jti)',
        response: {
          204: z.null(),
          401: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return logoutController.handle({ sessionId: request.user.jti }, reply)
    },
  )
}
