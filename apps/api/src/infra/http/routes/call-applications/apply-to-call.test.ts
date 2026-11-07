import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeCallOnDatabase } from '@tests/factories/make-call'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { CallStatus } from '@/domain/call/enterprise/entities/call'

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

describe('(E2E) - POST /api/v1/calls/:callId/applications', () => {
  afterAll(async () => await app.close())

  it('should be able to apply to an open call', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { call } = await makeCallOnDatabase({ authorId: author.id })

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/applications`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ message: 'Tenho experiência com Node.js' })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      application: {
        id: expect.any(String),
        callId: call.id.toString(),
        applicantId: user.id.toString(),
        message: 'Tenho experiência com Node.js',
        status: 'PENDING',
        decidedAt: null,
        createdAt: expect.any(String),
        updatedAt: null,
      },
    })
  })

  it('should be able to apply without a message', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { call } = await makeCallOnDatabase({ authorId: author.id })

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/applications`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})

    expect(response.status).toBe(201)
    expect(response.body.application.message).toBeNull()
  })

  it('should not be able to apply without authentication', async () => {
    const response = await request(app.server)
      .post(`/api/v1/calls/${new UniqueEntityId().toString()}/applications`)
      .send({})

    expect(response.status).toBe(401)
  })

  it('should not be able to apply to a call that does not exist', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post(`/api/v1/calls/${new UniqueEntityId().toString()}/applications`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to apply to your own call', async () => {
    const { accessToken, user } = await authenticateUser()
    const { call } = await makeCallOnDatabase({ authorId: user.id })

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/applications`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})

    expect(response.status).toBe(403)
  })

  it('should not be able to apply to a closed call', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { call } = await makeCallOnDatabase({ authorId: author.id, status: CallStatus.CLOSED })

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/applications`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})

    expect(response.status).toBe(409)
  })

  it('should not be able to apply after the deadline', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { call } = await makeCallOnDatabase({
      authorId: author.id,
      applicationDeadline: new Date(Date.now() - 1000),
    })

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/applications`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})

    expect(response.status).toBe(409)
  })

  it('should not be able to apply twice to the same call', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { call } = await makeCallOnDatabase({ authorId: author.id })

    await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/applications`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/applications`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
