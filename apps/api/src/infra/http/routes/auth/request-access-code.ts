import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { makeRequestAccessCodeController } from '../../factories/auth/make-request-access-code-controller'

export async function requestAccessCodeRoute(app: FastifyInstance) {
  const requestAccessCodeController = makeRequestAccessCodeController()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/access-code',
    {
      schema: {
        tags: ['auth'],
        summary: 'Solicitar código de acesso',
        description: 'Gera um código de acesso e envia por e-mail para o usuário autenticar-se',
        body: z.object({
          email: z.email().describe('O e-mail do usuário'),
        }),
        response: {
          204: z.null(),
          400: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return requestAccessCodeController.handle(request.body, reply)
    },
  )
}
