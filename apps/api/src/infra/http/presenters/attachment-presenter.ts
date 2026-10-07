import type { Attachment } from '@/domain/storage/enterprise/entities/attachment'

export class AttachmentPresenter {
  static toHTTP(attachment: Attachment) {
    return {
      id: attachment.id.toString(),
      storageKey: attachment.storageKey,
      mimeType: attachment.mimeType,
      name: attachment.name,
      size: attachment.size,
      createdAt: attachment.createdAt.toISOString(),
    }
  }
}
