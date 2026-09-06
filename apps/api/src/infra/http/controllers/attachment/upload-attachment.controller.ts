import type { FastifyReply } from 'fastify'
import type { UploadAttachmentUseCase } from '@/domain/storage/application/use-cases/upload-attachment'
import { AttachmentPresenter } from '../../presenters/attachment-presenter'

interface UploadAttachmentBody {
  name: string
  mimeType: string
  size: number
  attachmentFolder: string
}

export class UploadAttachmentController {
  constructor(private readonly uploadAttachment: UploadAttachmentUseCase) {}

  async handle({ name, mimeType, size, attachmentFolder }: UploadAttachmentBody, reply: FastifyReply) {
    const result = await this.uploadAttachment.execute({ name, mimeType, size, attachmentFolder })

    if (result.isLeft()) {
      return reply.status(400).send({
        message: result.value.message,
      })
    }

    return reply.status(201).send({
      attachment: AttachmentPresenter.toHTTP(result.value.attachment),
      expiresIn: result.value.itemStorage.expiresIn,
      uploadUrl: result.value.itemStorage.url,
    })
  }
}
