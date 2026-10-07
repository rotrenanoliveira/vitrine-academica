import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeDeleteAttachmentController } from '../../factories/attachment/make-delete-attachment-controller'

export async function deleteAttachmentRoute(app: FastifyInstance) {
  const deleteAttachmentController = makeDeleteAttachmentController()

  app.withTypeProvider<ZodTypeProvider>().delete(
    '/attachments/:attachmentId',
    {
      schema: {
        tags: ['attachments'],
        summary: 'Remover um arquivo',
        description: 'Remove um arquivo do banco de dados e da Cloudflare R2',
        params: z.object({
          attachmentId: z.string().describe('ID do arquivo'),
        }),
        response: {
          204: z.null(),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      return deleteAttachmentController.handle(request.params, reply)
    },
  )
}
