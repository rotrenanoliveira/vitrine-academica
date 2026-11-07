import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeListProjectMembersController } from '../../factories/project/make-list-project-members-controller'

export async function listProjectMembersRoute(app: FastifyInstance) {
  const listProjectMembersController = makeListProjectMembersController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/:projectId/members',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Listar os membros de um projeto',
        description:
          'O dono vê todos os convites. As outras pessoas veem só os coautores que aceitaram, e só em projetos publicados',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        response: {
          200: z.object({
            members: z.array(
              z.object({
                id: z.string(),
                userId: z.string(),
                name: z.string(),
                status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']),
                createdAt: z.iso.datetime(),
              }),
            ),
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
      return listProjectMembersController.handle(
        {
          projectId: request.params.projectId,
          requesterId: request.user.sub,
        },
        reply,
      )
    },
  )
}
