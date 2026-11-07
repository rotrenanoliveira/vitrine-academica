import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeCallOnDatabase } from '@tests/factories/make-call'
import { makeCallApplicationOnDatabase } from '@tests/factories/make-call-application'
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

async function seedPendingApplication(authorId: UniqueEntityId) {
  const { user: applicant } = await makeUserOnDatabase()
  const { call } = await makeCallOnDatabase({ authorId })
  const { application } = await makeCallApplicationOnDatabase({ callId: call.id, applicantId: applicant.id })

  return { call, application, applicant }
}

describe('(E2E) - POST /api/v1/calls/:callId/applications/:applicationId/decision', () => {
  afterAll(async () => await app.close())

  it('should be able to approve an application', async () => {
    const { accessToken, user } = await authenticateUser()
    const { call, application } = await seedPendingApplication(user.id)

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/applications/${application.id.toString()}/decision`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ decision: 'APPROVED' })

    expect(response.status).toBe(200)
    expect(response.body.application.id).toBe(application.id.toString())
    expect(response.body.application.status).toBe('APPROVED')
    expect(response.body.application.decidedAt).toEqual(expect.any(String))
    expect(response.body.notified).toBe(true)
  })

  it('should be able to reject an application', async () => {
    const { accessToken, user } = await authenticateUser()
    const { call, application } = await seedPendingApplication(user.id)

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/applications/${application.id.toString()}/decision`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ decision: 'REJECTED' })

    expect(response.status).toBe(200)
    expect(response.body.application.status).toBe('REJECTED')
  })

  it('should be able to decide an application after the call was closed', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: applicant } = await makeUserOnDatabase()
    const { call } = await makeCallOnDatabase({ authorId: user.id, status: CallStatus.CLOSED })
    const { application } = await makeCallApplicationOnDatabase({ callId: call.id, applicantId: applicant.id })

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/applications/${application.id.toString()}/decision`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ decision: 'APPROVED' })

    expect(response.status).toBe(200)
  })

  it('should not be able to decide an application of a call of another author', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { call, application } = await seedPendingApplication(author.id)

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/applications/${application.id.toString()}/decision`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ decision: 'APPROVED' })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to decide an application twice', async () => {
    const { accessToken, user } = await authenticateUser()
    const { call, application } = await seedPendingApplication(user.id)
    const url = `/api/v1/calls/${call.id.toString()}/applications/${application.id.toString()}/decision`

    await request(app.server).post(url).set('Authorization', `Bearer ${accessToken}`).send({ decision: 'APPROVED' })

    const response = await request(app.server)
      .post(url)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ decision: 'REJECTED' })

    expect(response.status).toBe(409)
  })

  it('should not be able to decide an application that does not exist', async () => {
    const { accessToken, user } = await authenticateUser()
    const { call } = await makeCallOnDatabase({ authorId: user.id })

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/applications/${new UniqueEntityId().toString()}/decision`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ decision: 'APPROVED' })

    expect(response.status).toBe(404)
  })

  it('should not be able to decide an application of a call that does not exist', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post(
        `/api/v1/calls/${new UniqueEntityId().toString()}/applications/${new UniqueEntityId().toString()}/decision`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ decision: 'APPROVED' })

    expect(response.status).toBe(404)
  })

  it('should not be able to decide with an invalid decision', async () => {
    const { accessToken, user } = await authenticateUser()
    const { call, application } = await seedPendingApplication(user.id)

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/applications/${application.id.toString()}/decision`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ decision: 'PENDING' })

    expect(response.status).toBe(400)
  })

  it('should not be able to decide an application without authentication', async () => {
    const response = await request(app.server)
      .post(
        `/api/v1/calls/${new UniqueEntityId().toString()}/applications/${new UniqueEntityId().toString()}/decision`,
      )
      .send({ decision: 'APPROVED' })

    expect(response.status).toBe(401)
  })
})
