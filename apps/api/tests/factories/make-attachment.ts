import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { faker } from '@faker-js/faker'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Attachment, type AttachmentProps } from '@/domain/storage/enterprise/entities/attachment'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAttachmentsRepository } from '@/infra/database/repositories/drizzle-attachments-repository'
import { makeStorage } from '@/infra/storage/make-storage'

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

export async function makeAttachmentOnDatabase(override: Partial<AttachmentProps> = {}) {
  const { attachment } = makeAttachment(override)

  const attachmentsRepository = new DrizzleAttachmentsRepository(db)

  await attachmentsRepository.create(attachment)

  return { attachment }
}

export async function makeSignedUrl(attachment: Attachment) {
  const storage = makeStorage()

  const signedUrl = await storage.createSignedUrl({
    key: attachment.storageKey,
    mimeType: attachment.mimeType,
    size: attachment.size,
  })

  return { uploadUrl: signedUrl }
}

function _loadFile() {
  const filePath = resolve(process.cwd(), 'tests/files/pintura.jpg')
  const fileBuffer = readFileSync(filePath)
  const { size } = statSync(filePath)

  return { filePath, fileBuffer, size }
}

export async function makeAttachmentOnStorage(attachment: Attachment, fileBuffer: Buffer, uploadUrl?: string) {
  const signedUrl = uploadUrl ?? (await makeSignedUrl(attachment)).uploadUrl.url

  await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Length': String(attachment.size),
    },
    body: fileBuffer,
  })

  return { attachment }
}

export async function makeDeleteAttachmentOnStorage(attachmentKey: string) {
  const storage = makeStorage()

  await storage.delete(attachmentKey)
}
