import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeListMyProjectInvitationsController } from '../../factories/project/make-list-my-project-invitations-controller'

export async function listMyProjectInvitationsRoute(app: FastifyInstance) {
  const listMyProjectInvitationsController = makeListMyProjectInvitationsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/invitations/me',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Listar meus convites de projeto',
        description: 'Lista os convites da pessoa logada, do mais novo ao mais antigo, com o projeto e quem convidou',
        querystring: z.object({
          status: z.nativeEnum(ProjectMemberStatus).optional().describe('Filtra os convites pelo status'),
        }),
        response: {
          200: z.object({
            invitations: z.array(
              z.object({
                id: z.string(),
                status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']),
                createdAt: z.iso.datetime(),
                project: z.object({
                  id: z.string(),
                  title: z.string(),
                }),
                owner: z
                  .object({
                    id: z.string(),
                    name: z.string(),
                  })
                  .nullable(),
              }),
            ),
          }),
          401: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return listMyProjectInvitationsController.handle({ userId: request.user.sub }, request.query, reply)
    },
  )
}