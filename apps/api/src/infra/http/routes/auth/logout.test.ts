import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'

describe('(E2E) - DELETE /api/v1/auth/sessions', () => {
  afterAll(async () => await app.close())

  async function authenticateUser() {
    const { user } = await makeUserOnDatabase()
    const { account } = await makeAccountOnDatabase({ userId: user.id })
    const { plainCode } = await makeAccessCodeOnDatabase({ accountId: account.id })

    const loginResponse = await request(app.server).post('/api/v1/auth/sessions').send({
      email: user.email,
      code: plainCode,
    })

    return loginResponse.body.accessToken as string
  }

  it('should be able to logout by revoking the session', async () => {
    const accessToken = await authenticateUser()

    const response = await request(app.server)
      .delete('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(204)

    const secondLogout = await request(app.server)
      .delete('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(secondLogout.status).toBe(401)
    expect(secondLogout.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to logout without a token', async () => {
    const response = await request(app.server).delete('/api/v1/auth/sessions')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to logout with an invalid token', async () => {
    const response = await request(app.server)
      .delete('/api/v1/auth/sessions')
      .set('Authorization', 'Bearer invalid.token.here')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
