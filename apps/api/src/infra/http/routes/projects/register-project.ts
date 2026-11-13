import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeRegisterProjectController } from '../../factories/project/make-register-project-controller'
import { projectHttpSchema } from '../../schemas/project-schemas'

export async function registerProjectRoute(app: FastifyInstance) {
  const registerProjectController = makeRegisterProjectController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/projects',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Registrar um novo projeto',
        description: 'Registra um novo projeto em rascunho na aplicação',
        body: z.object({
          title: z.string().min(1).describe('O título do projeto'),
          description: z.string().min(1).describe('A descrição do projeto'),
          slug: z.string().min(1).describe('O slug único do projeto'),
          tags: z.array(z.uuid()).min(1).describe('IDs das tags do projeto'),
          coverUrl: z.uuid().optional().nullable().describe('ID do attachment de capa do projeto'),
          attachments: z.array(z.string()).optional().describe('IDs dos anexos do projeto'),
        }),
        response: {
          201: z.object({
            project: projectHttpSchema,
          }),
          400: z.object({
            message: z.string(),
          }),
          401: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return registerProjectController.handle(
        {
          ...request.body,
          authorId: request.user.sub,
          sessionId: request.user.jti,
        },
        reply,
      )
    },
  )
}
