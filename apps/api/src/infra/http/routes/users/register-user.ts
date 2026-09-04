import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { makeRegisterUserController } from '../../factories/user/make-register-user-controller'

export async function registerUserRoute(app: FastifyInstance) {
  const registerUserController = makeRegisterUserController()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/users',
    {
      schema: {
        tags: ['users'],
        summary: 'Registrar um novo usuário',
        description: 'Registra um novo usuário na aplicação',
        body: z.object({
          name: z.string().min(1).describe('O nome do usuário'),
          email: z.email().describe('O email do usuário'),
        }),
        response: {
          201: z.object({
            user: z.object({
              id: z.string(),
              name: z.string(),
              email: z.email(),
              status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED', 'DELETED']),
              createdAt: z.iso.datetime(),
            }),
          }),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return registerUserController.handle(request.body, reply)
    },
  )
}
