import { appForTest as app } from '@tests/app'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeUser, makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'

describe('(E2E) - POST /api/v1/auth/access-code', () => {
  afterAll(async () => await app.close())

  it('should be able to request an access code', async () => {
    const { user } = await makeUserOnDatabase()
    await makeAccountOnDatabase({ userId: user.id })

    const response = await request(app.server).post('/api/v1/auth/access-code').send({
      email: user.email,
    })

    expect(response.status).toBe(204)
  })

  it('should not be able to request an access code when user does not exist', async () => {
    const { user } = makeUser()

    const response = await request(app.server).post('/api/v1/auth/access-code').send({
      email: user.email,
    })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to request an access code when user is unavailable', async () => {
    const { user } = await makeUserOnDatabase({ status: UserStatus.BLOCKED })
    await makeAccountOnDatabase({ userId: user.id })

    const response = await request(app.server).post('/api/v1/auth/access-code').send({
      email: user.email,
    })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
