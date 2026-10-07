import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeDeleteUserAccountController } from '../../factories/user/make-delete-user-account-controller'

export async function deleteUserAccountRoute(app: FastifyInstance) {
  const deleteUserAccountController = makeDeleteUserAccountController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().delete(
    '/users/me',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['users'],
        summary: 'Excluir conta',
        description:
          'Anonimiza os dados do usuário autenticado. Se ele for o único gerente de uma instituição com outros membros, a exclusão é bloqueada.',
        response: {
          200: z.object({
            archivedInstitutions: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
              }),
            ),
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
          409: z.object({
            message: z.string(),
            institutions: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      return deleteUserAccountController.handle(request, reply)
    },
  )
}
