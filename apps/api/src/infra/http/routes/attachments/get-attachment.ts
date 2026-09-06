import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeGetAttachmentController } from '../../factories/attachment/make-get-attachment-controller'

export async function getAttachmentRoute(app: FastifyInstance) {
  const getAttachmentController = makeGetAttachmentController()

  app.withTypeProvider<ZodTypeProvider>().get(
    '/attachments/:attachmentId',
    {
      schema: {
        tags: ['attachments'],
        summary: 'Obter os dados de um arquivo',
        description: 'Retorna os metadados de um arquivo',
        params: z.object({
          attachmentId: z.string().describe('ID do arquivo'),
        }),
        response: {
          200: z.object({
            attachment: z.object({
              id: z.string(),
              storageKey: z.string(),
              mimeType: z.string(),
              name: z.string(),
              size: z.coerce.number().int().positive(),
              createdAt: z.iso.datetime(),
            }),
            attachmentUrl: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return getAttachmentController.handle(request.params, reply)
    },
  )
}
