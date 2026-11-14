import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { makeOptionalAuthenticateMiddleware } from '../../factories/auth/make-optional-authenticate-middleware'
import { makeFetchProjectsController } from '../../factories/project/make-fetch-projects-controller'
import { projectListHttpSchema } from '../../schemas/project-schemas'

export async function fetchProjectsRoute(app: FastifyInstance) {
  const fetchProjectsController = makeFetchProjectsController()
  const optionalAuthenticate = makeOptionalAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/projects',
    {
      onRequest: [optionalAuthenticate],
      schema: {
        tags: ['projects'],
        summary: 'Listar projetos',
        description:
          'Lista os projetos. scope=all devolve o catálogo com os filtros da query. scope=user restringe às tags de interesse ativas do usuário autenticado. Sem scope, usuário autenticado usa as tags de interesse e visitante recebe o catálogo.',
        querystring: z.object({
          scope: z.enum(['all', 'user']).optional(),
          status: z.enum(['SKETCH', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional(),
          title: z.string().optional(),
          tags: z.union([z.uuid(), z.array(z.uuid())]).optional(),
          page: z.coerce.number().int().min(1).default(1).describe('Página da listagem'),
          limit: z.coerce.number().int().min(1).max(100).default(100).describe('Quantidade de itens por página'),
        }),
        response: {
          200: z.object({
            total: z.number(),
            page: z.number().int().min(1),
            limit: z.number().int().min(1),
            projects: z.array(projectListHttpSchema),
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
      const { tags } = request.query
      const tagIds = tags === undefined ? undefined : Array.isArray(tags) ? tags : [tags]

      return fetchProjectsController.handle(
        {
          userId: request.headers.authorization ? request.user.sub : undefined,
          scope: request.query.scope,
          status: request.query.status ? ProjectStatus[request.query.status] : undefined,
          title: request.query.title,
          tagIds,
          page: request.query.page,
          limit: request.query.limit,
        },
        reply,
      )
    },
  )
}
