import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeCallOnDatabase } from '@tests/factories/make-call'
import { makeCallSkillOnDatabase } from '@tests/factories/make-call-skill'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
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

const DAY_IN_MS = 24 * 60 * 60 * 1000

function daysFromNow(days: number) {
  return new Date(Date.now() + days * DAY_IN_MS).toISOString()
}

describe('(E2E) - PUT /api/v1/calls/:callId', () => {
  afterAll(async () => await app.close())

  it('should be able to update a call as owner', async () => {
    const { accessToken, user } = await authenticateUser()
    const { tag } = await makeTagOnDatabase()
    const { call } = await makeCallOnDatabase({ authorId: user.id })
    await makeCallSkillOnDatabase({ callId: call.id, tagId: tag.id })
    const applicationDeadline = daysFromNow(14)

    const response = await request(app.server)
      .put(`/api/v1/calls/${call.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Título atualizado',
        description: 'Descrição atualizada',
        applicationDeadline,
      })

    expect(response.status).toBe(200)
    expect(response.body.call.title).toBe('Título atualizado')
    expect(response.body.call.description).toBe('Descrição atualizada')
    expect(response.body.call.applicationDeadline).toBe(applicationDeadline)
    expect(response.body.call.skills).toHaveLength(1)
  })

  it('should be able to replace the skills of a call', async () => {
    const { accessToken, user } = await authenticateUser()
    const { tag: backend } = await makeTagOnDatabase()
    const { tag: design } = await makeTagOnDatabase()
    const { call } = await makeCallOnDatabase({ authorId: user.id })
    await makeCallSkillOnDatabase({ callId: call.id, tagId: backend.id })

    const response = await request(app.server)
      .put(`/api/v1/calls/${call.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: call.title,
        description: call.description,
        applicationDeadline: call.applicationDeadline.toISOString(),
        skills: [{ tagId: design.id.toString(), description: 'Figma' }],
      })

    expect(response.status).toBe(200)
    expect(response.body.call.skills).toEqual([
      { id: expect.any(String), tagId: design.id.toString(), description: 'Figma' },
    ])
  })

  it('should not be able to update a call of another author', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { call } = await makeCallOnDatabase({ authorId: author.id })

    const response = await request(app.server)
      .put(`/api/v1/calls/${call.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Hack',
        description: 'Hack',
        applicationDeadline: call.applicationDeadline.toISOString(),
      })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to update a closed call', async () => {
    const { accessToken, user } = await authenticateUser()
    const { call } = await makeCallOnDatabase({ authorId: user.id, status: CallStatus.CLOSED })

    const response = await request(app.server)
      .put(`/api/v1/calls/${call.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Novo título',
        description: call.description,
        applicationDeadline: call.applicationDeadline.toISOString(),
      })

    expect(response.status).toBe(409)
  })

  it('should not be able to change the deadline to a past date', async () => {
    const { accessToken, user } = await authenticateUser()
    const { call } = await makeCallOnDatabase({ authorId: user.id })

    const response = await request(app.server)
      .put(`/api/v1/calls/${call.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: call.title,
        description: call.description,
        applicationDeadline: daysFromNow(-1),
      })

    expect(response.status).toBe(400)
  })

  it('should not be able to update a call that does not exist', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .put(`/api/v1/calls/${new UniqueEntityId().toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Título',
        description: 'Descrição',
        applicationDeadline: daysFromNow(7),
      })

    expect(response.status).toBe(404)
  })

  it('should not be able to update a call without authentication', async () => {
    const response = await request(app.server)
      .put(`/api/v1/calls/${new UniqueEntityId().toString()}`)
      .send({
        title: 'Título',
        description: 'Descrição',
        applicationDeadline: daysFromNow(7),
      })

    expect(response.status).toBe(401)
  })
})
