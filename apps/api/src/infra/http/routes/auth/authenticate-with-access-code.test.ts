import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeUser, makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'

describe('(E2E) - POST /api/v1/auth/sessions', () => {
  afterAll(async () => await app.close())

  it('should be able to authenticate with a valid access code', async () => {
    const { user } = await makeUserOnDatabase({ status: UserStatus.PENDING })
    const { account } = await makeAccountOnDatabase({ userId: user.id })
    const { plainCode } = await makeAccessCodeOnDatabase({ accountId: account.id })

    const response = await request(app.server).post('/api/v1/auth/sessions').send({
      email: user.email,
      code: plainCode,
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      accessToken: expect.any(String),
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        status: UserStatus.ACTIVE,
        accountId: account.id.toString(),
      },
    })
  })

  it('should not be able to authenticate with an invalid access code', async () => {
    const { user } = await makeUserOnDatabase()
    const { account } = await makeAccountOnDatabase({ userId: user.id })
    await makeAccessCodeOnDatabase({ accountId: account.id, plainCode: 'VALIDCODE123' })

    const response = await request(app.server).post('/api/v1/auth/sessions').send({
      email: user.email,
      code: 'WRONGCODE999',
    })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to authenticate when user does not exist', async () => {
    const { user } = makeUser()

    const response = await request(app.server).post('/api/v1/auth/sessions').send({
      email: user.email,
      code: 'ANYCODE12345',
    })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to authenticate with an already consumed access code', async () => {
    const { user } = await makeUserOnDatabase()
    const { account } = await makeAccountOnDatabase({ userId: user.id })
    const { plainCode } = await makeAccessCodeOnDatabase({ accountId: account.id })

    await request(app.server).post('/api/v1/auth/sessions').send({
      email: user.email,
      code: plainCode,
    })

    const response = await request(app.server).post('/api/v1/auth/sessions').send({
      email: user.email,
      code: plainCode,
    })

    // UC returns InvalidAccessCodeError when no active code remains after consume
    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
