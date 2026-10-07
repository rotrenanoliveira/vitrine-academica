import { appForTest as app } from '@tests/app'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import request from 'supertest'

describe('(E2E) - GET /api/v1/tags', () => {
  afterAll(async () => await app.close())

  it('should be able to fetch all tags', async () => {
    const { tag: firstTag } = await makeTagOnDatabase({ name: 'Biologia' })
    const { tag: secondTag } = await makeTagOnDatabase({ name: 'Química' })

    const response = await request(app.server).get('/api/v1/tags')

    expect(response.status).toBe(200)
    expect(response.body.tags).toHaveLength(2)
    expect(response.body.tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: firstTag.id.toString(),
          name: firstTag.name,
          slug: firstTag.slug.value,
        }),
        expect.objectContaining({
          id: secondTag.id.toString(),
          name: secondTag.name,
          slug: secondTag.slug.value,
        }),
      ]),
    )
  })
})
