import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makePreferenceTagOnDatabase } from '@tests/factories/make-preference-tag'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { PreferenceTagStatus } from '@/domain/tag/enterprise/entities/preference-tag'

async function authenticateUser() {
  const { user } = await makeUserOnDatabase()
  const { account } = await makeAccountOnDatabase({ userId: user.id })
  const { plainCode } = await makeAccessCodeOnDatabase({ accountId: account.id })

  const loginResponse = await request(app.server).post('/api/v1/auth/sessions').send({
    email: user.email,
    code: plainCode,
  })

  return {
    accessToken: loginResponse.body.accessToken as string,
    user,
  }
}

describe('(E2E) - POST /api/v1/preference-tags/:tagId/deactivate', () => {
  afterAll(async () => await app.close())

  it('should be able to deactivate a preference tag', async () => {
    const { accessToken, user } = await authenticateUser()
    const { tag } = await makeTagOnDatabase()
    await makePreferenceTagOnDatabase({ userId: user.id, tagId: tag.id })

    const response = await request(app.server)
      .post(`/api/v1/preference-tags/${tag.id.toString()}/deactivate`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.preferenceTag.status).toBe(PreferenceTagStatus.INACTIVE)
  })

  it('should not be able to deactivate a preference tag without authentication', async () => {
    const { tag } = await makeTagOnDatabase()

    const response = await request(app.server).post(`/api/v1/preference-tags/${tag.id.toString()}/deactivate`)

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to deactivate a preference tag that the user does not have', async () => {
    const { accessToken } = await authenticateUser()
    const { tag } = await makeTagOnDatabase()

    const response = await request(app.server)
      .post(`/api/v1/preference-tags/${tag.id.toString()}/deactivate`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
