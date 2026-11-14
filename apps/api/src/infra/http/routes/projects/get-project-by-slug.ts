import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeOptionalAuthenticateMiddleware } from '../../factories/auth/make-optional-authenticate-middleware'
import { makeGetProjectBySlugController } from '../../factories/project/make-get-project-by-slug-controller'
import { projectHttpSchema } from '../../schemas/project-schemas'

export async function getProjectBySlugRoute(app: FastifyInstance) {
  const getProjectBySlugController = makeGetProjectBySlugController()
  const optionalAuthenticate = makeOptionalAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects/slug/:slug',
    {
      onRequest: [optionalAuthenticate],
      schema: {
        tags: ['projects'],
        summary: 'Obter projeto por slug',
        description:
          'Retorna um projeto pelo slug. Visitante só vê publicados. Dono vê qualquer status; coautor aceito também.',
        params: z.object({
          slug: z.string().min(1).describe('O slug do projeto'),
        }),
        response: {
          200: z.object({
            project: projectHttpSchema,
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
      return getProjectBySlugController.handle(
        {
          slug: request.params.slug,
          requesterId: request.headers.authorization ? request.user.sub : undefined,
        },
        reply,
      )
    },
  )
}
