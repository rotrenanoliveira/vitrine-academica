import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { callSkillInputSchema, callWithSkillsSchema } from '@/utils/call-schemas'
import { messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeUpdateCallController } from '../../factories/call/make-update-call-controller'

export async function updateCallRoute(app: FastifyInstance) {
  const updateCallController = makeUpdateCallController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().put(
    '/calls/:callId',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['calls'],
        summary: 'Atualizar chamado',
        description:
          'Atualiza título, proposta, prazo e, opcionalmente, as habilidades de um chamado aberto do autor autenticado',
        params: z.object({
          callId: z.uuid().describe('O ID do chamado'),
        }),
        body: z.object({
          title: z.string().min(1).max(200).describe('O título do chamado'),
          description: z.string().min(1).describe('A proposta do chamado'),
          applicationDeadline: z.iso.datetime().describe('O prazo final para candidaturas (ISO 8601, em UTC)'),
          skills: z
            .array(callSkillInputSchema)
            .min(1)
            .optional()
            .describe('Substitui as habilidades do chamado; se omitido, mantém as atuais'),
        }),
        response: {
          200: z.object({
            call: callWithSkillsSchema,
          }),
          400: messageSchema,
          401: messageSchema,
          403: messageSchema,
          404: messageSchema,
          409: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return updateCallController.handle(
        {
          callId: request.params.callId,
          authorId: request.user.sub,
        },
        request.body,
        reply,
      )
    },
  )
}
