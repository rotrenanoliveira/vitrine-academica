import { type Either, left, right } from '@/core/either'
import type { Attachment } from '../../enterprise/entities/attachment'
import { AttachmentNotFoundError } from '../_errors/attachment-not-found-error'
import type { InvalidAttachmentError } from '../_errors/invalid-attachment-error'
import type { AttachmentsRepository } from '../repositories/attachments-repository'

interface GetAttachmentUseCaseRequest {
  attachmentId: string
}

type GetAttachmentUseCaseResponse = Either<InvalidAttachmentError, { attachment: Attachment }>

export class GetAttachmentUseCase {
  constructor(private readonly attachmentsRepository: AttachmentsRepository) {}

  async execute({ attachmentId }: GetAttachmentUseCaseRequest): Promise<GetAttachmentUseCaseResponse> {
    const attachment = await this.attachmentsRepository.findById(attachmentId)

    if (!attachment) {
      return left(new AttachmentNotFoundError())
    }

    return right({ attachment })
  }
}
