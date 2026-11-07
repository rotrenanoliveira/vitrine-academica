import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeCallOnDatabase } from '@tests/factories/make-call'
import { makeCallApplicationOnDatabase } from '@tests/factories/make-call-application'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMember } from '@tests/factories/make-institution-member'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { CallApplicationStatus } from '@/domain/call/enterprise/entities/call-application'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleInstitutionMembersRepository } from '@/infra/database/repositories/drizzle-institution-members-repository'

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

  it('should return the applicants with name, institution and role but without email', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: applicant } = await makeUserOnDatabase({ name: 'Maria Silva', email: 'maria@email.com' })
    const { institution } = await makeInstitutionOnDatabase({
      name: 'UMC',
      registerBy: user.id,
    })
    const { member } = makeInstitutionMember({
      institutionId: institution.id.toString(),
      userId: applicant.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })
    await new DrizzleInstitutionMembersRepository(db).create(member)
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
    expect(response.body.applications[0].id).toBe(application.id.toString())
    expect(response.body.applications[0].message).toBe('Quero participar')
    expect(response.body.applications[0].applicant).toEqual({
      id: applicant.id.toString(),
      name: 'Maria Silva',
      memberships: [{ institutionId: institution.id.toString(), institutionName: 'UMC', role: 'STUDENT' }],
    })
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
