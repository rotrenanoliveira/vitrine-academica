import { type Either, left, right } from '@/core/either'
import type { Storage } from '@/domain/storage/application/storage/storage'
import type { Attachment } from '../../enterprise/entities/attachment'
import { AttachmentNotFoundError } from '../_errors/attachment-not-found-error'
import type { InvalidAttachmentError } from '../_errors/invalid-attachment-error'
import type { AttachmentsRepository } from '../repositories/attachments-repository'

interface DeleteAttachmentUseCaseRequest {
  attachmentId: string
}

type DeleteAttachmentUseCaseResponse = Either<InvalidAttachmentError, null>

export class DeleteAttachmentUseCase {
  constructor(
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly storage: Storage,
  ) {}

  async execute({ attachmentId }: DeleteAttachmentUseCaseRequest): Promise<DeleteAttachmentUseCaseResponse> {
    const attachmentResult = await this.findAttachment(attachmentId)

    if (attachmentResult.isLeft()) {
      return left(attachmentResult.value)
    }

    await this.removeAttachment(attachmentResult.value)

    return right(null)
  }

  private async findAttachment(attachmentId: string): Promise<Either<AttachmentNotFoundError, Attachment>> {
    const attachment = await this.attachmentsRepository.findById(attachmentId)

    if (!attachment) {
      return left(new AttachmentNotFoundError())
    }

    return right(attachment)
  }

  private async removeAttachment(attachment: Attachment) {
    await this.storage.delete(attachment.storageKey)
    await this.attachmentsRepository.delete(attachment)
  }
}
