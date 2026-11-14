import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeCallOnDatabase } from '@tests/factories/make-call'
import { makeCallApplicationOnDatabase } from '@tests/factories/make-call-application'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'

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

describe('(E2E) - GET /api/v1/calls/me/applications', () => {
  afterAll(async () => await app.close())

  it('should return only my applications with the call, newest first', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { user: otherApplicant } = await makeUserOnDatabase()
    const { call: firstCall } = await makeCallOnDatabase({ authorId: author.id, title: 'Primeiro chamado' })
    const { call: secondCall } = await makeCallOnDatabase({ authorId: author.id, title: 'Segundo chamado' })
    const { application: older } = await makeCallApplicationOnDatabase({
      callId: firstCall.id,
      applicantId: user.id,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    })
    const { application: newer } = await makeCallApplicationOnDatabase({
      callId: secondCall.id,
      applicantId: user.id,
      createdAt: new Date('2026-02-01T00:00:00Z'),
    })
    await makeCallApplicationOnDatabase({ callId: firstCall.id, applicantId: otherApplicant.id })

    const response = await request(app.server)
      .get('/api/v1/calls/me/applications')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.applications.map((application: { id: string }) => application.id)).toEqual([
      newer.id.toString(),
      older.id.toString(),
    ])
    expect(response.body.applications[0].call).toEqual({
      id: secondCall.id.toString(),
      title: 'Segundo chamado',
      status: 'OPEN',
      applicationDeadline: secondCall.applicationDeadline.toISOString(),
    })
  })

  it('should return an empty list when I have no applications', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/calls/me/applications')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ applications: [] })
  })

  it('should not be able to fetch my applications without authentication', async () => {
    const response = await request(app.server).get('/api/v1/calls/me/applications')

    expect(response.status).toBe(401)
  })
})
