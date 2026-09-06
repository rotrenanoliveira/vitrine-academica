import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { appForTest as app } from '@tests/app'
import {
  makeAttachmentOnDatabase,
  makeAttachmentOnStorage,
  makeDeleteAttachmentOnStorage,
} from '@tests/factories/make-attachment'
import request from 'supertest'
import { Attachment } from '@/domain/storage/enterprise/entities/attachment'

describe('(E2E) - GET /api/v1/attachments/:attachmentId', () => {
  afterAll(async () => await app.close())

  it('should be able to get an attachment', async () => {
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

    const response = await request(app.server).get(`/api/v1/attachments/${attachmentId}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      attachment: {
        id: attachmentId,
        storageKey: attachment.storageKey,
        mimeType: attachment.mimeType,
        name: attachment.name,
        size: attachment.size,
        createdAt: expect.any(String),
      },
      attachmentUrl: expect.any(String),
    })

    const attachmentResponse = await fetch(response.body.attachmentUrl)
    expect(attachmentResponse.status).toBe(200)

    await makeDeleteAttachmentOnStorage(attachment.storageKey)
  })
})
