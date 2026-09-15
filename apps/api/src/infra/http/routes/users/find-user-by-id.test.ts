import { appForTest as app } from '@tests/app'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'

describe('(E2E) - GET /api/v1/users/:userId', () => {
  afterAll(async () => await app.close())

  it('should be able to find a user by id', async () => {
    const { user } = await makeUserOnDatabase()
    const userId = user.id.toString()

    await makeAccountOnDatabase({ userId: user.id })

    const response = await request(app.server).get(`/api/v1/users/${userId}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      user: {
        name: user.name,
        email: user.email,
        status: UserStatus.PENDING,
        id: expect.any(String),
        accountId: expect.any(String),
      },
    })
  })
})
