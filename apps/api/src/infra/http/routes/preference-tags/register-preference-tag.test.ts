import { appForTest as app } from '@tests/app'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { PreferenceTagStatus } from '@/domain/tag/enterprise/entities/preference-tag'

describe('(E2E) - POST /api/v1/preference-tags', () => {
  afterAll(async () => await app.close())

  it('should be able to register a preference tag', async () => {
    const { user } = await makeUserOnDatabase()
    const { tag } = await makeTagOnDatabase()

    const response = await request(app.server).post('/api/v1/preference-tags').send({
      userId: user.id.toString(),
      tagId: tag.id.toString(),
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      preferenceTag: {
        id: expect.any(String),
        userId: user.id.toString(),
        tagId: tag.id.toString(),
        status: PreferenceTagStatus.ACTIVE,
        createdAt: expect.any(String),
      },
    })
  })

  it('should not be able to register a preference tag when user does not exist', async () => {
    const { tag } = await makeTagOnDatabase()

    const response = await request(app.server).post('/api/v1/preference-tags').send({
      userId: new UniqueEntityId().toString(),
      tagId: tag.id.toString(),
    })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to register a preference tag when tag does not exist', async () => {
    const { user } = await makeUserOnDatabase()

    const response = await request(app.server).post('/api/v1/preference-tags').send({
      userId: user.id.toString(),
      tagId: new UniqueEntityId().toString(),
    })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to register a preference tag when it already exists', async () => {
    const { user } = await makeUserOnDatabase()
    const { tag } = await makeTagOnDatabase()

    await request(app.server).post('/api/v1/preference-tags').send({
      userId: user.id.toString(),
      tagId: tag.id.toString(),
    })

    const response = await request(app.server).post('/api/v1/preference-tags').send({
      userId: user.id.toString(),
      tagId: tag.id.toString(),
    })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
