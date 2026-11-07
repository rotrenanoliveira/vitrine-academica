import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeCallOnDatabase } from '@tests/factories/make-call'
import { makeCallSkillOnDatabase } from '@tests/factories/make-call-skill'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
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

describe('(E2E) - GET /api/v1/calls/me', () => {
  afterAll(async () => await app.close())

  it('should be able to fetch my calls in any status', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: otherUser } = await makeUserOnDatabase()
    const { tag } = await makeTagOnDatabase()
    const { call: openCall } = await makeCallOnDatabase({ authorId: user.id })
    const { call: closedCall } = await makeCallOnDatabase({ authorId: user.id, status: CallStatus.CLOSED })
    const { call: otherCall } = await makeCallOnDatabase({ authorId: otherUser.id })
    await makeCallSkillOnDatabase({ callId: openCall.id, tagId: tag.id })

    const response = await request(app.server).get('/api/v1/calls/me').set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)

    const ids = response.body.calls.map((call: { id: string }) => call.id)

    expect(ids).toHaveLength(2)
    expect(ids).toContain(openCall.id.toString())
    expect(ids).toContain(closedCall.id.toString())
    expect(ids).not.toContain(otherCall.id.toString())

    const returnedOpenCall = response.body.calls.find((call: { id: string }) => call.id === openCall.id.toString())

    expect(returnedOpenCall.skills).toHaveLength(1)
  })

  it('should return an empty list when I have no calls', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server).get('/api/v1/calls/me').set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ calls: [] })
  })

  it('should not be able to fetch my calls without authentication', async () => {
    const response = await request(app.server).get('/api/v1/calls/me')

    expect(response.status).toBe(401)
  })
})
