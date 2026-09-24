import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'

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

describe('(E2E) - GET /api/v1/users/me/export', () => {
  afterAll(async () => await app.close())

  it('should be able to export authenticated user data', async () => {
    const { accessToken, user } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/users/me/export')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)

    expect(response.body).toEqual({
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        status: expect.any(String),
      },
      account: {
        id: expect.any(String),
        avatarId: null,
        createdAt: expect.any(String),
        confirmationAt: null,
        consentedAt: null,
        updatedAt: null,
      },
      sessions: expect.any(Array),
      institutions: expect.any(Array),
      preferences: expect.any(Array),
      projects: expect.any(Array),
    })
  })

  it('should not be able to export user data without authentication', async () => {
    const response = await request(app.server).get('/api/v1/users/me/export')

    expect(response.status).toBe(401)

    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
