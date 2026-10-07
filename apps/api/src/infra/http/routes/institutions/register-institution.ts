import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  institutionMemberSchema,
  institutionSchema,
  institutionTypeSchema,
  messageSchema,
} from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeRegisterInstitutionController } from '../../factories/institution/make-register-institution-controller'

export async function registerInstitutionRoute(app: FastifyInstance) {
  const registerInstitutionController = makeRegisterInstitutionController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/institutions',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['institutions'],
        summary: 'Registrar uma nova instituição',
        description: 'Registra uma nova instituição e cria o membro MANAGER do registrante',
        body: z.object({
          name: z.string().min(1).describe('O nome da instituição'),
          type: institutionTypeSchema.describe('O tipo da instituição'),
          description: z.string().min(1).describe('A descrição da instituição'),
          shouldProof: z.boolean().optional().describe('Se exige comprovante para membership'),
          shouldVerify: z.boolean().optional().describe('Se exige verificação'),
          domain: z.string().optional().describe('Domínio de e-mail da instituição'),
        }),
        response: {
          201: z.object({
            institution: institutionSchema,
            member: institutionMemberSchema,
          }),
          401: messageSchema,
          409: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return registerInstitutionController.handle(
        {
          ...request.body,
          registerBy: request.user.sub,
        },
        reply,
      )
    },
  )
}
