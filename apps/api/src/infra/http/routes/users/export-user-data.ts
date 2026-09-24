import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeExportUserDataController } from '../../factories/user/make-export-user-data-controller'

export async function exportUserDataRoute(app: FastifyInstance) {
  const exportUserDataController = makeExportUserDataController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/users/me/export',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['users'],
        summary: 'Exportar dados do usuário',
        description: 'Exporta todos os dados do usuário autenticado para atendimento à LGPD',
        response: {
          200: z.object({
            user: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
              status: z.string(),
            }),
            account: z
              .object({
                id: z.string(),
                avatarId: z.string().nullable(),
                createdAt: z.coerce.date(),
                confirmationAt: z.coerce.date().nullable(),
                consentedAt: z.coerce.date().nullable(),
                updatedAt: z.coerce.date().nullable(),
              })
              .nullable(),
            sessions: z.array(
              z.object({ id: z.string(), expiresAt: z.coerce.date(), revokedAt: z.coerce.date().nullable() }),
            ),
            institutions: z.array(
              z.object({
                institutionId: z.string(),
                role: z.string(),
                status: z.string(),
              }),
            ),
            preferences: z.array(
              z.object({
                tagId: z.string(),
              }),
            ),
            projects: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                status: z.string(),
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
        },
      },
    },
    async (request, reply) => {
      return exportUserDataController.handle(request, reply)
    },
  )
}
