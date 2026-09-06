import type { FastifyReply } from 'fastify'
import type { GetAttachmentUseCase } from '@/domain/storage/application/use-cases/get-attachment'
import { AttachmentPresenter } from '../../presenters/attachment-presenter'

interface GetAttachmentBody {
  attachmentId: string
}

export class GetAttachmentController {
  constructor(private readonly getAttachment: GetAttachmentUseCase) {}

  async handle({ attachmentId }: GetAttachmentBody, reply: FastifyReply) {
    const result = await this.getAttachment.execute({ attachmentId })

    if (result.isLeft()) {
      return reply.status(404).send({
        message: result.value.message,
      })
    }

    return reply.status(200).send({
      attachment: AttachmentPresenter.toHTTP(result.value.attachment),
      attachmentUrl: result.value.attachmentUrl,
    })
  }
}
