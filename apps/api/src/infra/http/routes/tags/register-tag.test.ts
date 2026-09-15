import { appForTest as app } from '@tests/app'
import { makeTag, makeTagOnDatabase } from '@tests/factories/make-tag'
import request from 'supertest'

describe('(E2E) - POST /api/v1/tags', () => {
  afterAll(async () => await app.close())

  it('should be able to register a new tag', async () => {
    const { tag } = makeTag({ name: 'Inteligência Artificial' })

    const response = await request(app.server).post('/api/v1/tags').send({
      name: tag.name,
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      tag: {
        id: expect.any(String),
        name: tag.name,
        slug: tag.slug.value,
      },
    })
  })

  it('should not be able to register a tag when it already exists', async () => {
    const { tag } = await makeTagOnDatabase({ name: 'Machine Learning' })

    const response = await request(app.server).post('/api/v1/tags').send({
      name: tag.name,
    })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
