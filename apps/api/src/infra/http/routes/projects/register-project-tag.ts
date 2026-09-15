import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeRegisterProjectTagController } from '../../factories/project-tag/make-register-project-tag-controller'

export async function registerProjectTagRoute(app: FastifyInstance) {
  const registerProjectTagController = makeRegisterProjectTagController()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/projects/:projectId/tags',
    {
      schema: {
        tags: ['project-tags'],
        summary: 'Cadastrar uma tag em um projeto',
        description: 'Vincula uma tag a um projeto existente',
        params: z.object({
          projectId: z.uuid().describe('O ID do projeto'),
        }),
        body: z.object({
          tagId: z.uuid().describe('O ID da tag'),
        }),
        response: {
          201: z.object({
            projectTag: z.object({
              id: z.string(),
              projectId: z.string(),
              tagId: z.string(),
            }),
          }),
          404: z.object({
            message: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return registerProjectTagController.handle(request.params, request.body, reply)
    },
  )
}
