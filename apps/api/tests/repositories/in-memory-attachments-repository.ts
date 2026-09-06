import type { AttachmentsRepository } from '@/domain/storage/application/repositories/attachments-repository'
import type { Attachment } from '@/domain/storage/enterprise/entities/attachment'

export class InMemoryAttachmentsRepository implements AttachmentsRepository {
  public items: Attachment[] = []

  async findById(id: string): Promise<Attachment | null> {
    return this.items.find((attachment) => attachment.id.toString() === id) || null
  }

  async findByKey(storageKey: string): Promise<Attachment | null> {
    return this.items.find((attachment) => attachment.storageKey === storageKey) || null
  }

  async create(attachment: Attachment): Promise<void> {
    this.items.push(attachment)
  }

  async delete(attachment: Attachment): Promise<void> {
    const attachmentIndex = this.items.findIndex((item) => item.id === attachment.id)

    if (attachmentIndex < 0) {
      return
    }

    this.items.splice(attachmentIndex, 1)
  }
}
