import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { callWithSkillsSchema } from '@/utils/call-schemas'
import { messageSchema } from '@/utils/institution-schemas'
import { makeGetCallByIdController } from '../../factories/call/make-get-call-by-id-controller'

export async function getCallByIdRoute(app: FastifyInstance) {
  const getCallByIdController = makeGetCallByIdController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/calls/:callId',
    {
      schema: {
        tags: ['calls'],
        summary: 'Obter chamado por ID',
        description: 'Retorna um chamado, aberto ou encerrado, com suas habilidades. Não exige autenticação',
        params: z.object({
          callId: z.uuid().describe('O ID do chamado'),
        }),
        response: {
          200: z.object({
            call: callWithSkillsSchema,
          }),
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return getCallByIdController.handle({ callId: request.params.callId }, reply)
    },
  )
}
