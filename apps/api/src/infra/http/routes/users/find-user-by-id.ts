import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { makeFindUserByIdController } from '../../factories/user/make-find-user-by-id-controller'

export async function findUserByIdRoute(app: FastifyInstance) {
  const findUserByIdController = makeFindUserByIdController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/users/:userId',
    {
      schema: {
        tags: ['users'],
        summary: 'Buscar um usuário por ID',
        description: 'Busca um usuário por ID na aplicação',
        params: z.object({
          userId: z.uuid().describe('O ID do usuário'),
        }),
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
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return findUserByIdController.handle(request.params, reply)
    },
  )
}
