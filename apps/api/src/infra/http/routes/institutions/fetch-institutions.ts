import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { institutionSchema } from '@/utils/institution-schemas'
import { makeFetchInstitutionsController } from '../../factories/institution/make-fetch-institutions-controller'

export async function fetchInstitutionsRoute(app: FastifyInstance) {
  const fetchInstitutionsController = makeFetchInstitutionsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/institutions',
    {
      schema: {
        tags: ['institutions'],
        summary: 'Listar instituições',
        description: 'Lista todas as instituições cadastradas',
        response: {
          200: z.object({
            institutions: z.array(institutionSchema),
          }),
        },
      },
    },
    async (_request, reply) => {
      return fetchInstitutionsController.handle(reply)
    },
  )
}
