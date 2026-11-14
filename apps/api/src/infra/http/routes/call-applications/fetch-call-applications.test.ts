import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeCallOnDatabase } from '@tests/factories/make-call'
import { makeCallApplicationOnDatabase } from '@tests/factories/make-call-application'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { CallApplicationStatus } from '@/domain/call/enterprise/entities/call-application'

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

describe('(E2E) - GET /api/v1/calls/:callId/applications', () => {
  afterAll(async () => await app.close())

  it('should return the applications with applicant name and without excess fields', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: applicant } = await makeUserOnDatabase({ name: 'Maria Silva', email: 'maria@email.com' })
    const { call } = await makeCallOnDatabase({ authorId: user.id })
    const { application } = await makeCallApplicationOnDatabase({
      callId: call.id,
      applicantId: applicant.id,
      message: 'Quero participar',
    })

    const response = await request(app.server)
      .get(`/api/v1/calls/${call.id.toString()}/applications`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.applications).toHaveLength(1)
    expect(response.body.applications[0]).toEqual({
      id: application.id.toString(),
      callId: call.id.toString(),
      applicantId: applicant.id.toString(),
      message: 'Quero participar',
      status: CallApplicationStatus.PENDING,
      decidedAt: null,
      createdAt: expect.any(String),
      applicantName: 'Maria Silva',
    })
    expect(response.body.applications[0]).not.toHaveProperty('updatedAt')
    expect(response.body.applications[0]).not.toHaveProperty('applicant')
    expect(JSON.stringify(response.body)).not.toContain('maria@email.com')
  })

  it('should be able to filter the applications by status', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: firstApplicant } = await makeUserOnDatabase()
    const { user: secondApplicant } = await makeUserOnDatabase()
    const { call } = await makeCallOnDatabase({ authorId: user.id })
    const { application: pending } = await makeCallApplicationOnDatabase({
      callId: call.id,
      applicantId: firstApplicant.id,
    })
    await makeCallApplicationOnDatabase({
      callId: call.id,
      applicantId: secondApplicant.id,
      status: CallApplicationStatus.APPROVED,
    })

    const response = await request(app.server)
      .get(`/api/v1/calls/${call.id.toString()}/applications`)
      .query({ status: 'PENDING' })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.applications).toHaveLength(1)
    expect(response.body.applications[0].id).toBe(pending.id.toString())
  })

  it('should return an empty list when the call has no applications', async () => {
    const { accessToken, user } = await authenticateUser()
    const { call } = await makeCallOnDatabase({ authorId: user.id })

    const response = await request(app.server)
      .get(`/api/v1/calls/${call.id.toString()}/applications`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ applications: [] })
  })

  it('should not be able to fetch the applications of a call of another author', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { call } = await makeCallOnDatabase({ authorId: author.id })

    const response = await request(app.server)
      .get(`/api/v1/calls/${call.id.toString()}/applications`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to fetch the applications of a call that does not exist', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get(`/api/v1/calls/${new UniqueEntityId().toString()}/applications`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
  })

  it('should not be able to fetch the applications without authentication', async () => {
    const response = await request(app.server).get(`/api/v1/calls/${new UniqueEntityId().toString()}/applications`)

    expect(response.status).toBe(401)
  })
})
