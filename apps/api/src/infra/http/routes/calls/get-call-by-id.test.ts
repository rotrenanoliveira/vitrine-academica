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

describe('(E2E) - GET /api/v1/calls/:callId', () => {
  afterAll(async () => await app.close())

  it('should be able to get a call with its skills', async () => {
    const { accessToken, user } = await authenticateUser()
    const { tag } = await makeTagOnDatabase()
    const { call } = await makeCallOnDatabase({ authorId: user.id })
    await makeCallSkillOnDatabase({ callId: call.id, tagId: tag.id, description: 'Node.js' })

    const response = await request(app.server)
      .get(`/api/v1/calls/${call.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.call.id).toBe(call.id.toString())
    expect(response.body.call.status).toBe('OPEN')
    expect(response.body.call.skills).toEqual([
      { id: expect.any(String), tagId: tag.id.toString(), description: 'Node.js' },
    ])
  })

  it('should be able to get a closed call from another author', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { call } = await makeCallOnDatabase({ authorId: author.id, status: CallStatus.CLOSED })

    const response = await request(app.server)
      .get(`/api/v1/calls/${call.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.call.status).toBe('CLOSED')
  })

  it('should not be able to get a call that does not exist', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get(`/api/v1/calls/${new UniqueEntityId().toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to get a call without authentication', async () => {
    const response = await request(app.server).get(`/api/v1/calls/${new UniqueEntityId().toString()}`)

    expect(response.status).toBe(401)
  })
})
