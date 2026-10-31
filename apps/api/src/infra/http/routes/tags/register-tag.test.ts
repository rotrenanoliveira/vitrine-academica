import { appForTest as app } from '@tests/app'
import { makeTag, makeTagOnDatabase } from '@tests/factories/make-tag'
import request from 'supertest'

describe('(E2E) - POST /api/v1/tags', () => {
  afterAll(async () => await app.close())

  it('criar tag: com nome novo, deve retornar 201 com a tag', async () => {
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

  it('criar tag: com nome já existente, deve retornar 400 com mensagem', async () => {
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
