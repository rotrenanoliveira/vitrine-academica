import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { institutionSchema, messageSchema } from '@/utils/institution-schemas'
import { makeGetInstitutionByIdController } from '../../factories/institution/make-get-institution-by-id-controller'

export async function getInstitutionByIdRoute(app: FastifyInstance) {
  const getInstitutionByIdController = makeGetInstitutionByIdController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/institutions/:institutionId',
    {
      schema: {
        tags: ['institutions'],
        summary: 'Buscar instituição por ID',
        description: 'Retorna uma instituição pelo ID',
        params: z.object({
          institutionId: z.uuid().describe('O ID da instituição'),
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
      return getInstitutionByIdController.handle(
        {
          institutionId: request.params.institutionId,
        },
        reply,
      )
    },
  )
}
