import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeInviteProjectMemberController } from '../../factories/project/make-invite-project-member-controller'

export async function inviteProjectMemberRoute(app: FastifyInstance) {
  const inviteProjectMemberController = makeInviteProjectMemberController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/projects/:projectId/members',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Convidar um membro para o projeto',
        description: 'O dono do projeto convida uma pessoa pelo e-mail. O convite fica pendente até ela responder',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        body: z.object({
          email: z.email().describe('O e-mail da pessoa convidada'),
        }),
        response: {
          201: z.object({
            projectMember: z.object({
              id: z.string(),
              projectId: z.string(),
              userId: z.string(),
              status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']),
              createdAt: z.iso.datetime(),
            }),
          }),
          400: z.object({
            message: z.string(),
          }),
          401: z.object({
            message: z.string(),
          }),
          403: z.object({
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
      return inviteProjectMemberController.handle(
        {
          projectId: request.params.projectId,
          authorId: request.user.sub,
        },
        request.body,
        reply,
      )
    },
  )
}
