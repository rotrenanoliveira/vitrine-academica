import { type Either, left, right } from '@/core/either'
import { env } from '@/environment-variables'
import type { Attachment } from '../../enterprise/entities/attachment'
import { AttachmentNotFoundError } from '../_errors/attachment-not-found-error'
import type { InvalidAttachmentError } from '../_errors/invalid-attachment-error'
import type { AttachmentsRepository } from '../repositories/attachments-repository'

interface GetAttachmentUseCaseRequest {
  attachmentId: string
}

type GetAttachmentUseCaseResponse = Either<InvalidAttachmentError, { attachment: Attachment; attachmentUrl: string }>

export class GetAttachmentUseCase {
  constructor(private readonly attachmentsRepository: AttachmentsRepository) {}

  async execute({ attachmentId }: GetAttachmentUseCaseRequest): Promise<GetAttachmentUseCaseResponse> {
    const attachmentResult = await this.findAttachment(attachmentId)

    if (attachmentResult.isLeft()) {
      return left(attachmentResult.value)
    }

    const attachment = attachmentResult.value
    const attachmentUrl = this.buildAttachmentUrl(attachment)

    return right({ attachment, attachmentUrl })
  }

  private async findAttachment(attachmentId: string): Promise<Either<AttachmentNotFoundError, Attachment>> {
    const attachment = await this.attachmentsRepository.findById(attachmentId)

    if (!attachment) {
      return left(new AttachmentNotFoundError())
    }

    return right(attachment)
  }

  private buildAttachmentUrl(attachment: Attachment): string {
    return `${env.CLOUDFLARE_R2_ASSETS_URL}/${attachment.storageKey}`
  }
}
