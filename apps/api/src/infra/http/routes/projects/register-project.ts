import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeRegisterProjectController } from '../../factories/project/make-register-project-controller'

const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  authorId: z.string(),
  status: z.enum(['SKETCH', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']),
  attachments: z.array(z.string()),
  tags: z.array(z.string()),
  createdAt: z.iso.datetime(),
})

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
          attachments: z.array(z.string()).optional().describe('IDs dos anexos do projeto'),
          tags: z.array(z.string()).optional().describe('IDs das tags do projeto'),
        }),
        response: {
          201: z.object({
            project: projectSchema,
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
        },
        reply,
      )
    },
  )
}
