import { type Either, left, right } from '@/core/either'
import { Attachment } from '../../enterprise/entities/attachment'
import { InvalidAttachmentError } from '../_errors/invalid-attachment-error'
import type { AttachmentsRepository } from '../repositories/attachments-repository'
import type { CreateSignedUrlResponse, Storage } from '../storage/storage'

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf']

interface UploadAttachmentUseCaseRequest {
  name: string
  mimeType: string
  size: number
  attachmentFolder: string
}

type UploadAttachmentUseCaseResponse = Either<
  InvalidAttachmentError,
  { attachment: Attachment; itemStorage: CreateSignedUrlResponse }
>

export class UploadAttachmentUseCase {
  constructor(
    readonly attachmentsRepository: AttachmentsRepository,
    readonly storage: Storage,
  ) {}

  async execute({
    name,
    mimeType,
    size,
    attachmentFolder,
  }: UploadAttachmentUseCaseRequest): Promise<UploadAttachmentUseCaseResponse> {
    const validation = this.validateAttachment(mimeType, size)

    if (validation.isLeft()) {
      return left(validation.value)
    }

    const attachment = await this.buildAttachment(name, mimeType, size, attachmentFolder)

    const itemStorage = await this.storage.createSignedUrl({
      key: attachment.storageKey,
      mimeType,
      size,
    })

    await this.attachmentsRepository.create(attachment)

    return right({
      attachment,
      itemStorage,
    })
  }

  private validateAttachment(mimeType: string, size: number): Either<InvalidAttachmentError, null> {
    if (size <= 0) {
      return left(new InvalidAttachmentError(`Arquivo inválido.`))
    }

    if (size > MAX_ATTACHMENT_SIZE) {
      return left(
        new InvalidAttachmentError(
          `Tamanho de arquivo inválido, arquivo deve ter no máximo ${MAX_ATTACHMENT_SIZE} MB.`,
        ),
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return left(new InvalidAttachmentError(`Tipo de arquivo não permitido: ${mimeType}.`))
    }

    return right(null)
  }

  private async buildAttachment(
    name: string,
    mimeType: string,
    size: number,
    attachmentFolder: string,
  ): Promise<Attachment> {
    const itemStorageKey = Attachment.generateStorageKey(name, attachmentFolder)

    return Attachment.create({
      storageKey: itemStorageKey,
      mimeType,
      name,
      size,
    })
  }
}
