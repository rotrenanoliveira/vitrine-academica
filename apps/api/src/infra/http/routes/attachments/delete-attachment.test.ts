import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { appForTest as app } from '@tests/app'
import { makeAttachmentOnDatabase, makeAttachmentOnStorage } from '@tests/factories/make-attachment'
import request from 'supertest'
import { Attachment } from '@/domain/storage/enterprise/entities/attachment'

describe('(E2E) - DELETE /api/v1/attachments/:attachmentId', () => {
  afterAll(async () => await app.close())

  it('should be able to delete an attachment', async () => {
    const filePath = resolve(process.cwd(), 'tests/files/pintura.jpg')
    const fileBuffer = readFileSync(filePath)
    const { size } = statSync(filePath)

    const fileMimeType = 'image/jpeg'
    const fileName = 'pintura.jpg'
    const attachmentFolder = 'tests'

    const attachmentStorageKey = Attachment.generateStorageKey(fileName, attachmentFolder)
    const { attachment } = await makeAttachmentOnDatabase({
      storageKey: attachmentStorageKey,
      name: fileName,
      mimeType: fileMimeType,
      size,
    })

    await makeAttachmentOnStorage(attachment, fileBuffer)

    const attachmentId = attachment.id.toString()

    const response = await request(app.server).delete(`/api/v1/attachments/${attachmentId}`)

    expect(response.status).toBe(204)
  })
})
