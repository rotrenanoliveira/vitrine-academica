import { faker } from '@faker-js/faker'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Attachment, type AttachmentProps } from '@/domain/storage/enterprise/entities/attachment'

export function makeAttachment(override: Partial<AttachmentProps>, id?: UniqueEntityId) {
  const attachment = Attachment.create(
    {
      storageKey: `attachments/${faker.string.uuid}-file.png`,
      mimeType: 'image/png',
      size: 1024,
      name: 'file.png',
      ...override,
    },
    id,
  )

  return { attachment }
}
