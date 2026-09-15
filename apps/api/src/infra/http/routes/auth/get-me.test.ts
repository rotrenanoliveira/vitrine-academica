import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'

describe('(E2E) - GET /api/v1/auth/me', () => {
  afterAll(async () => await app.close())

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
      account,
    }
  }

  it('should be able to get the authenticated user', async () => {
    const { accessToken, user, account } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        status: expect.any(String),
        accountId: account.id.toString(),
      },
    })
  })

  it('should not be able to get the authenticated user without a token', async () => {
    const response = await request(app.server).get('/api/v1/auth/me')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to get the authenticated user with an invalid token', async () => {
    const response = await request(app.server)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.here')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
