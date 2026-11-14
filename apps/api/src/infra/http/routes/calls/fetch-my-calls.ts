import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { callWithSkillsSchema } from '@/utils/call-schemas'
import { messageSchema } from '@/utils/institution-schemas'
import { makeAuthenticateMiddleware } from '../../factories/auth/make-authenticate-middleware'
import { makeFetchMyCallsController } from '../../factories/call/make-fetch-my-calls-controller'

export async function fetchMyCallsRoute(app: FastifyInstance) {
  const fetchMyCallsController = makeFetchMyCallsController()
  const authenticate = makeAuthenticateMiddleware()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/calls/me',
    {
      onRequest: [authenticate],
      schema: {
        tags: ['calls'],
        summary: 'Listar meus chamados',
        description: 'Lista todos os chamados do autor autenticado, em qualquer status',
        response: {
          200: z.object({
            calls: z.array(callWithSkillsSchema),
          }),
          401: messageSchema,
        },
      },
    },
    async (request, reply) => {
      return fetchMyCallsController.handle({ authorId: request.user.sub }, reply)
    },
  )
}
