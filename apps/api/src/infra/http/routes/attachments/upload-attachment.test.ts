import { appForTest as app } from '@tests/app'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import request from 'supertest'

describe('(E2E) - POST /api/v1/attachments', () => {
  afterAll(async () => await app.close())

  it('should be able to register an attachment and upload the file to Cloudflare R2', async () => {
    const filePath = resolve(process.cwd(), 'tests/files/pintura.jpg')
    const fileBuffer = readFileSync(filePath)
    const { size } = statSync(filePath)
    const mimeType = 'image/jpeg'
    const name = 'pintura.jpg'
    const attachmentFolder = 'tests'

    const response = await request(app.server).post('/api/v1/attachments').send({
      name,
      mimeType,
      size,
      attachmentFolder,
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      attachment: {
        id: expect.any(String),
        storageKey: expect.stringMatching(/^tests\/.+-pinturajpg$/),
        mimeType,
        name,
        size,
        createdAt: expect.any(String),
      },
      uploadUrl: expect.any(String),
      expiresIn: expect.any(Number),
    })

    const uploadResponse = await fetch(response.body.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(size),
      },
      body: fileBuffer,
    })

    expect(uploadResponse.status).toBe(200)

    const deleteResponse = await request(app.server).delete(
      `/api/v1/attachments/${response.body.attachment.id}`,
    )

    expect(deleteResponse.status).toBe(204)
  })
})
