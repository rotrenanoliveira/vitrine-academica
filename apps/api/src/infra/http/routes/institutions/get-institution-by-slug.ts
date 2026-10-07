import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { institutionSchema, messageSchema } from '@/utils/institution-schemas'
import { makeGetInstitutionBySlugController } from '../../factories/institution/make-get-institution-by-slug-controller'

export async function getInstitutionBySlugRoute(app: FastifyInstance) {
  const getInstitutionBySlugController = makeGetInstitutionBySlugController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/institutions/slug/:slug',
    {
      schema: {
        tags: ['institutions'],
        summary: 'Buscar instituição por slug',
        description: 'Retorna uma instituição pelo slug',
        params: z.object({
          slug: z.string().min(1).describe('O slug da instituição'),
        }),
        response: {
          200: z.object({
            institution: institutionSchema,
          }),
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return getInstitutionBySlugController.handle(
        {
          slug: request.params.slug,
        },
        reply,
      )
    },
  )
}
