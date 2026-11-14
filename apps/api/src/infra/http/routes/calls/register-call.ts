import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { callSkillInputSchema, callWithSkillsSchema } from '@/utils/call-schemas'
import { messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeRegisterCallController } from '../../factories/call/make-register-call-controller'

export async function registerCallRoute(app: FastifyInstance) {
  const registerCallController = makeRegisterCallController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/calls',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['calls'],
        summary: 'Registrar um novo chamado',
        description:
          'Cria um chamado aberto para buscar colaboradores, com prazo de candidatura e habilidades necessárias',
        body: z.object({
          title: z.string().min(1).max(200).describe('O título do chamado'),
          description: z.string().min(1).describe('A proposta do chamado'),
          applicationDeadline: z.iso.datetime().describe('O prazo final para candidaturas (ISO 8601, em UTC)'),
          skills: z.array(callSkillInputSchema).min(1).describe('As habilidades necessárias para o chamado'),
        }),
        response: {
          201: z.object({
            call: callWithSkillsSchema,
          }),
          400: messageSchema,
          401: messageSchema,
          404: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return registerCallController.handle({ authorId: request.user.sub }, request.body, reply)
    },
  )
}
