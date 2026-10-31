import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeListActiveRatingCriteriaController } from '../../factories/project/make-list-active-rating-criteria-controller'

const criterionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  weight: z.number(),
  active: z.boolean(),
  validFrom: z.iso.datetime(),
  validUntil: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
})

export async function listActiveRatingCriteriaRoute(app: FastifyInstance) {
  const listActiveRatingCriteriaController = makeListActiveRatingCriteriaController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/rating-criteria',
    {
      schema: {
        tags: ['projects'],
        summary: 'Critérios de avaliação ativos',
        description: 'Lista os critérios acadêmicos vigentes para avaliação docente',
        response: {
          200: z.object({
            criteria: z.array(criterionSchema),
          }),
        },
      },
    },
    async (_request, reply) => {
      return listActiveRatingCriteriaController.handle({}, reply)
    },
  )
}
