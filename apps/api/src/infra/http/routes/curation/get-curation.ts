import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeGetCurationController } from '../../factories/curation/make-get-curation-controller'
import { projectListHttpSchema } from '../../schemas/project-schemas'

export async function getCurationRoute(app: FastifyInstance) {
  const getCurationController = makeGetCurationController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/curation',
    {
      schema: {
        tags: ['curation'],
        summary: 'Curadoria de projetos em destaque',
        description:
          'Devolve projetos em destaque da banca (avaliações de professores) e/ou da comunidade (estrelas), com capa resolvida. Use scope para filtrar a origem.',
        querystring: z.object({
          institutionId: z.string().optional().describe('Só projetos de autores com vínculo ativo nesta instituição'),
          months: z.coerce.number().int().min(1).max(12).optional().describe('Período em meses. Padrão: 3'),
          limit: z.coerce.number().int().min(1).max(50).optional().describe('Quantidade máxima de projetos'),
          scope: z
            .enum(['board', 'community', 'all'])
            .default('all')
            .optional()
            .describe('Origem da curadoria. Padrão: all'),
          title: z.string().optional().describe('Filtro por título do projeto'),
          tags: z
            .union([z.uuid(), z.array(z.uuid())])
            .optional()
            .describe('Filtro por IDs de tags'),
        }),
        response: {
          200: z.object({
            total: z.number(),
            projects: z.array(projectListHttpSchema),
          }),
        },
      },
    },
    async (request, reply) => {
      const { tags } = request.query
      const tagIds = tags === undefined ? undefined : Array.isArray(tags) ? tags : [tags]

      return getCurationController.handle(
        {
          institutionId: request.query.institutionId,
          months: request.query.months,
          limit: request.query.limit,
          scope: request.query.scope,
          title: request.query.title,
          tagIds,
        },
        reply,
      )
    },
  )
}
