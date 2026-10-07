import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeUploadAttachmentController } from '../../factories/attachment/make-upload-attachment-controller'

export async function uploadAttachmentRoute(app: FastifyInstance) {
  const uploadAttachmentController = makeUploadAttachmentController()

  app.withTypeProvider<ZodTypeProvider>().post(
    '/attachments',
    {
      schema: {
        tags: ['attachments'],
        summary: 'Salvar um novo arquivo',
        description: 'Salva os metadados do arquivo e retorna uma signed URL para o upload direto para o Cloudflare R2',
        body: z.object({
          name: z.string().min(1).describe('Nome original do arquivo'),
          mimeType: z.string().min(1).describe('Mime Type do arquivo'),
          size: z.coerce.number().int().positive().describe('Tamanho do arquivo em bytes'),
          attachmentFolder: z.string().min(1).describe('Pasta do arquivo dentro do bucket'),
        }),
        response: {
          201: z.object({
            attachment: z.object({
              id: z.string(),
              storageKey: z.string(),
              mimeType: z.string(),
              name: z.string(),
              size: z.coerce.number().int().positive(),
              createdAt: z.iso.datetime(),
            }),
            uploadUrl: z.url(),
            expiresIn: z.number().int().positive(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      return await uploadAttachmentController.handle(request.body, reply)
    },
  )
}
