import { eq } from 'drizzle-orm'
import type { AttachmentsRepository } from '@/domain/storage/application/repositories/attachments-repository'
import type { Attachment } from '@/domain/storage/enterprise/entities/attachment'
import type { DrizzleClient } from '../drizzle/client'
import { DrizzleAttachmentMapper } from '../drizzle/mappers/drizzle-attachment-mapper'
import { attachments } from '../drizzle/schemas'

export class DrizzleAttachmentsRepository implements AttachmentsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<Attachment | null> {
    const [row] = await this.db.select().from(attachments).where(eq(attachments.id, id)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleAttachmentMapper.toDomain(row)
  }

  async findByKey(storageKey: string): Promise<Attachment | null> {
    const [row] = await this.db.select().from(attachments).where(eq(attachments.storageKey, storageKey)).limit(1)

    if (!row) {
      return null
    }

    return DrizzleAttachmentMapper.toDomain(row)
  }

  async create(attachment: Attachment): Promise<void> {
    await this.db.insert(attachments).values(DrizzleAttachmentMapper.toPersistence(attachment))
  }

  async delete(attachment: Attachment): Promise<void> {
    await this.db.delete(attachments).where(eq(attachments.id, attachment.id.toString()))
  }
}
