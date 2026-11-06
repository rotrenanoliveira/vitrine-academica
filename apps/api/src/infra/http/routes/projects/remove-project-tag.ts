import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeRemoveProjectTagController } from '../../factories/project-tag/make-remove-project-tag-controller'

const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  authorId: z.string(),
  status: z.nativeEnum(ProjectStatus),
  attachments: z.array(z.string()),
  tags: z.array(z.string()),
  createdAt: z.iso.datetime(),
})

export async function removeProjectTagRoute(app: FastifyInstance) {
  const removeProjectTagController = makeRemoveProjectTagController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().delete(
    '/projects/:projectId/tags/:tagId',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['project-tags'],
        summary: 'Remover uma tag de um projeto',
        description:
          'Desvincula uma tag de um projeto do autor autenticado. Para vincular de novo, basta cadastrá-la novamente.',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
          tagId: z.uuid().describe('O ID da tag'),
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
      return removeProjectTagController.handle(
        {
          actorId: request.user.sub,
          projectId: request.params.projectId,
          tagId: request.params.tagId,
        },
        reply,
      )
    },
  )
}
