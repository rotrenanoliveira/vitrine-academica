import type { Attachment } from '../../enterprise/entities/attachment'

export interface AttachmentsRepository {
  findById(id: string): Promise<Attachment | null>
  findByKey(storageKey: string): Promise<Attachment | null>

  create(attachment: Attachment): Promise<void>

  delete(attachment: Attachment): Promise<void>
}
