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

describe('(E2E) - GET /api/v1/calls', () => {
  afterAll(async () => await app.close())

  it('should return only open calls that are still within the deadline', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { tag } = await makeTagOnDatabase()
    const { call: openCall } = await makeCallOnDatabase({ authorId: author.id })
    const { call: closedCall } = await makeCallOnDatabase({ authorId: author.id, status: CallStatus.CLOSED })
    const { call: expiredCall } = await makeCallOnDatabase({
      authorId: author.id,
      applicationDeadline: new Date(Date.now() - 1000),
    })
    await makeCallSkillOnDatabase({ callId: openCall.id, tagId: tag.id, description: 'Node.js' })
    await makeCallSkillOnDatabase({ callId: closedCall.id, tagId: tag.id })
    await makeCallSkillOnDatabase({ callId: expiredCall.id, tagId: tag.id })

    const response = await request(app.server).get('/api/v1/calls').set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.calls).toHaveLength(1)
    expect(response.body.calls[0].id).toBe(openCall.id.toString())
    expect(response.body.calls[0].skills).toEqual([
      { id: expect.any(String), tagId: tag.id.toString(), description: 'Node.js' },
    ])
  })

  it('should be able to filter calls by tag', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { tag: backend } = await makeTagOnDatabase()
    const { tag: design } = await makeTagOnDatabase()
    const { call: backendCall } = await makeCallOnDatabase({ authorId: author.id })
    const { call: designCall } = await makeCallOnDatabase({ authorId: author.id })
    await makeCallSkillOnDatabase({ callId: backendCall.id, tagId: backend.id })
    await makeCallSkillOnDatabase({ callId: designCall.id, tagId: design.id })

    const response = await request(app.server)
      .get('/api/v1/calls')
      .query({ tagId: backend.id.toString() })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.calls).toHaveLength(1)
    expect(response.body.calls[0].id).toBe(backendCall.id.toString())
  })

  it('should not be able to filter by a tag that does not exist', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/calls')
      .query({ tagId: new UniqueEntityId().toString() })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should be able to fetch calls without authentication', async () => {
    const { user: author } = await makeUserOnDatabase()
    const { tag } = await makeTagOnDatabase()
    const { call } = await makeCallOnDatabase({ authorId: author.id })
    await makeCallSkillOnDatabase({ callId: call.id, tagId: tag.id })

    const response = await request(app.server).get('/api/v1/calls')

    expect(response.status).toBe(200)
    expect(response.body.calls).toHaveLength(1)
    expect(response.body.calls[0].id).toBe(call.id.toString())
  })
})
