import { appForTest as app } from '@tests/app'
import { makeUser } from '@tests/factories/make-user'
import request from 'supertest'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'

describe('(E2E) - POST /api/v1/users', () => {
  afterAll(async () => await app.close())

  it('should be able to register a new user', async () => {
    const { user } = makeUser()

    const response = await request(app.server).post('/api/v1/users').send({
      name: user.name,
      email: user.email,
    })

    expect(response.status).toBe(201)
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
