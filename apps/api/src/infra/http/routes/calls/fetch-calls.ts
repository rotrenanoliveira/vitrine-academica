import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { callWithSkillsSchema } from '@/utils/call-schemas'
import { messageSchema } from '@/utils/institution-schemas'
import { makeFetchCallsController } from '../../factories/call/make-fetch-calls-controller'

export async function fetchCallsRoute(app: FastifyInstance) {
  const fetchCallsController = makeFetchCallsController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/calls',
    {
      schema: {
        tags: ['calls'],
        summary: 'Listar chamados abertos',
        description:
          'Lista os chamados abertos e dentro do prazo, do mais recente ao mais antigo, com filtro opcional por tag. Não exige autenticação',
        querystring: z.object({
          tagId: z.uuid().optional().describe('O ID da tag para filtrar os chamados'),
        }),
        response: {
          200: z.object({
            calls: z.array(callWithSkillsSchema),
          }),
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return fetchCallsController.handle({ tagId: request.query.tagId }, reply)
    },
  )
}
