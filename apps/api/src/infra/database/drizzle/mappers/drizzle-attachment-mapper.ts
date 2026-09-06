import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Attachment } from '@/domain/storage/enterprise/entities/attachment'
import type { attachments } from '../schemas/attachments'

type DrizzleAttachment = typeof attachments.$inferSelect
type DrizzleAttachmentInsert = typeof attachments.$inferInsert

export class DrizzleAttachmentMapper {
  static toDomain(row: DrizzleAttachment): Attachment {
    return Attachment.create(
      {
        storageKey: row.storageKey,
        mimeType: row.mimeType,
        size: row.size,
        name: row.name,
        createdAt: row.createdAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(attachment: Attachment): DrizzleAttachmentInsert {
    return {
      id: attachment.id.toString(),
      storageKey: attachment.storageKey,
      mimeType: attachment.mimeType,
      size: attachment.size,
      name: attachment.name,
      createdAt: attachment.createdAt,
    }
  }
}
