import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

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

const DAY_IN_MS = 24 * 60 * 60 * 1000

function daysFromNow(days: number) {
  return new Date(Date.now() + days * DAY_IN_MS).toISOString()
}

describe('(E2E) - POST /api/v1/calls', () => {
  afterAll(async () => await app.close())

  it('should be able to register a call', async () => {
    const { accessToken, user } = await authenticateUser()
    const { tag } = await makeTagOnDatabase()
    const applicationDeadline = daysFromNow(7)

    const response = await request(app.server)
      .post('/api/v1/calls')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Busco dev para API',
        description: 'Projeto de extensão que precisa de um desenvolvedor backend',
        applicationDeadline,
        skills: [{ tagId: tag.id.toString(), description: 'Node.js' }],
      })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      call: {
        id: expect.any(String),
        authorId: user.id.toString(),
        title: 'Busco dev para API',
        description: 'Projeto de extensão que precisa de um desenvolvedor backend',
        applicationDeadline,
        status: 'OPEN',
        skills: [{ id: expect.any(String), tagId: tag.id.toString(), description: 'Node.js' }],
        createdAt: expect.any(String),
        updatedAt: null,
      },
    })
  })

  it('should not be able to register a call without authentication', async () => {
    const { tag } = await makeTagOnDatabase()

    const response = await request(app.server)
      .post('/api/v1/calls')
      .send({
        title: 'Busco dev',
        description: 'Descrição',
        applicationDeadline: daysFromNow(7),
        skills: [{ tagId: tag.id.toString() }],
      })

    expect(response.status).toBe(401)
  })

  it('should not be able to register a call without skills', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post('/api/v1/calls')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Busco dev',
        description: 'Descrição',
        applicationDeadline: daysFromNow(7),
        skills: [],
      })

    expect(response.status).toBe(400)
  })

  it('should not be able to register a call with a past deadline', async () => {
    const { accessToken } = await authenticateUser()
    const { tag } = await makeTagOnDatabase()

    const response = await request(app.server)
      .post('/api/v1/calls')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Busco dev',
        description: 'Descrição',
        applicationDeadline: daysFromNow(-1),
        skills: [{ tagId: tag.id.toString() }],
      })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to register a call with a tag that does not exist', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post('/api/v1/calls')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Busco dev',
        description: 'Descrição',
        applicationDeadline: daysFromNow(7),
        skills: [{ tagId: new UniqueEntityId().toString() }],
      })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
