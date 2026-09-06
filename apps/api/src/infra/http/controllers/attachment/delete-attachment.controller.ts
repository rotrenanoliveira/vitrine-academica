import type { FastifyReply } from 'fastify'
import type { DeleteAttachmentUseCase } from '@/domain/storage/application/use-cases/delete-attachment'

interface DeleteAttachmentBody {
  attachmentId: string
}

export class DeleteAttachmentController {
  constructor(private readonly deleteAttachment: DeleteAttachmentUseCase) {}

  async handle({ attachmentId }: DeleteAttachmentBody, reply: FastifyReply) {
    const result = await this.deleteAttachment.execute({ attachmentId })

    if (result.isLeft()) {
      return reply.status(404).send({
        message: result.value.message,
      })
    }

    return reply.status(204).send(null)
  }
}
