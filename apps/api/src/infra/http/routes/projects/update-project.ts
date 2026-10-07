import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeUpdateProjectController } from '../../factories/project/make-update-project-controller'

const projectStatusSchema = z.nativeEnum(ProjectStatus)

const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  authorId: z.string(),
  status: projectStatusSchema,
  attachments: z.array(z.string()),
  tags: z.array(z.string()),
  createdAt: z.iso.datetime(),
})

export async function updateProjectRoute(app: FastifyInstance) {
  const updateProjectController = makeUpdateProjectController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().put(
    '/projects/:projectId',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Atualizar projeto',
        description: 'Atualiza título, descrição e status de um projeto do autor autenticado',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        body: z.object({
          title: z.string().min(1).describe('O título do projeto'),
          description: z.string().min(1).describe('A descrição do projeto'),
          status: projectStatusSchema.optional().describe('O status do projeto'),
          attachments: z.array(z.string()).optional().describe('IDs dos anexos do projeto'),
        }),
        response: {
          200: z.object({
            project: projectSchema,
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
        },
      },
    },
    async (request, reply) => {
      return updateProjectController.handle(
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
