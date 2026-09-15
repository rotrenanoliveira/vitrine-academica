import { appForTest as app } from '@tests/app'
import { makePreferenceTagOnDatabase } from '@tests/factories/make-preference-tag'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

describe('(E2E) - GET /api/v1/users/:userId/preference-tags', () => {
  afterAll(async () => await app.close())

  it('should be able to fetch preference tags of a user', async () => {
    const { user } = await makeUserOnDatabase()
    const { tag: firstTag } = await makeTagOnDatabase({ name: 'Física' })
    const { tag: secondTag } = await makeTagOnDatabase({ name: 'História' })

    await makePreferenceTagOnDatabase({ userId: user.id, tagId: firstTag.id })
    await makePreferenceTagOnDatabase({ userId: user.id, tagId: secondTag.id })

    const response = await request(app.server).get(`/api/v1/users/${user.id.toString()}/preference-tags`)

    expect(response.status).toBe(200)
    expect(response.body.preferenceTags).toHaveLength(2)
  })

  it('should not be able to fetch preference tags when user does not exist', async () => {
    const response = await request(app.server).get(
      `/api/v1/users/${new UniqueEntityId().toString()}/preference-tags`,
    )

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
