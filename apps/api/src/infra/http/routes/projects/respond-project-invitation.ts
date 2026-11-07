import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeRespondProjectInvitationController } from '../../factories/project/make-respond-project-invitation-controller'

export async function respondProjectInvitationRoute(app: FastifyInstance) {
  const respondProjectInvitationController = makeRespondProjectInvitationController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/projects/invitations/:invitationId/respond',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Responder a um convite de projeto',
        description: 'A pessoa convidada aceita ou recusa o convite. Um convite só pode ser respondido uma vez',
        params: z.object({
          invitationId: z.uuid().describe('O ID do convite'),
        }),
        body: z.object({
          status: z
            .enum([ProjectMemberStatus.ACCEPTED, ProjectMemberStatus.REJECTED])
            .describe('A resposta: ACCEPTED para aceitar ou REJECTED para recusar'),
        }),
        response: {
          200: z.object({
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
      return respondProjectInvitationController.handle(
        {
          invitationId: request.params.invitationId,
          userId: request.user.sub,
        },
        request.body,
        reply,
      )
    },
  )
}