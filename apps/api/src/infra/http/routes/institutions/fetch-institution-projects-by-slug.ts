import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { messageSchema } from '@/utils/institution-schemas'
import { makeFetchInstitutionProjectsBySlugController } from '../../factories/institution/make-fetch-institution-projects-by-slug-controller'
import { projectListHttpSchema } from '../../schemas/project-schemas'

export async function fetchInstitutionProjectsBySlugRoute(app: FastifyInstance) {
  const fetchInstitutionProjectsBySlugController = makeFetchInstitutionProjectsBySlugController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/institutions/slug/:slug/projects',
    {
      schema: {
        tags: ['institutions'],
        summary: 'Listar projetos de uma instituição por slug',
        description:
          'Lista projetos cujo autor é membro ACTIVE da instituição. Não filtra pelo status do usuário. Mesmo formato de list item de GET /projects, com paginação.',
        params: z.object({
          slug: z.string().min(1).describe('O slug da instituição'),
        }),
        querystring: z.object({
          status: z.enum(['SKETCH', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional(),
          title: z.string().optional(),
          tags: z.union([z.uuid(), z.array(z.uuid())]).optional(),
          page: z.coerce.number().int().min(1).default(1).describe('Página da listagem'),
          limit: z.coerce.number().int().min(1).max(100).default(20).describe('Quantidade de itens por página'),
        }),
        response: {
          200: z.object({
            total: z.number(),
            page: z.number().int().min(1),
            limit: z.number().int().min(1),
            projects: z.array(projectListHttpSchema),
          }),
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      const { tags } = request.query
      const tagIds = tags === undefined ? undefined : Array.isArray(tags) ? tags : [tags]

      return fetchInstitutionProjectsBySlugController.handle(
        {
          slug: request.params.slug,
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
