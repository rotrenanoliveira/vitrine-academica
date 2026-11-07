import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeGetCurationController } from '../../factories/curation/make-get-curation-controller'

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

export async function getCurationRoute(app: FastifyInstance) {
  const getCurationController = makeGetCurationController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/curation',
    {
      schema: {
        tags: ['curation'],
        summary: 'Curadoria de projetos em destaque',
        description:
          'Devolve, em listas separadas, os projetos melhor avaliados pelos professores (banca) e pela comunidade (estrelas), criados nos últimos meses',
        querystring: z.object({
          institutionId: z.string().optional().describe('Só projetos de autores com vínculo ativo nesta instituição'),
          months: z.coerce.number().int().min(1).max(12).optional().describe('Período em meses. Padrão: 3'),
          limit: z.coerce.number().int().min(1).max(50).optional().describe('Quantos projetos por lista. Padrão: 10'),
        }),
        response: {
          200: z.object({
            board: z.array(
              z.object({
                project: projectSchema,
                teacherAverage: z.number(),
                teacherRatingsCount: z.number(),
              }),
            ),
            community: z.array(
              z.object({
                project: projectSchema,
                weightedScore: z.number(),
                starsCount: z.number(),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      return getCurationController.handle(request.query, reply)
    },
  )
}
