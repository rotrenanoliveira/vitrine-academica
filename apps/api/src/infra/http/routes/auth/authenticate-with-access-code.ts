import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { makeAuthenticateWithAccessCodeController } from '../../factories/auth/make-authenticate-with-access-code-controller'

export async function authenticateWithAccessCodeRoute(app: FastifyInstance) {
  const authenticateWithAccessCodeController = makeAuthenticateWithAccessCodeController()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/sessions',
    {
      schema: {
        tags: ['auth'],
        summary: 'Autenticar com código de acesso',
        description: 'Valida o código de acesso, cria uma sessão e retorna um JWT',
        body: z.object({
          email: z.email().describe('O e-mail do usuário'),
          code: z.string().min(1).describe('O código de acesso enviado por e-mail'),
        }),
        response: {
          201: z.object({
            accessToken: z.string(),
            user: z.object({
              id: z.string(),
              name: z.string(),
              email: z.email(),
              status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED', 'DELETED']),
              accountId: z.string(),
            }),
          }),
          400: z.object({
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
      return authenticateWithAccessCodeController.handle(request.body, reply)
    },
  )
}
