import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import {
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'

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

describe('(E2E) - POST /api/v1/institutions/:institutionId/members/:memberId/role', () => {
  afterAll(async () => await app.close())

  it('should be able to promote a member to manager', async () => {
    const { accessToken, user } = await authenticateUser()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })

    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.MANAGER,
    })

    const { member: student } = await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/members/${student.id.toString()}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: InstitutionMemberRole.MANAGER })

    expect(response.status).toBe(200)
    expect(response.body.member.role).toBe(InstitutionMemberRole.MANAGER)
  })

  it('should not be able to update role without authentication', async () => {
    const { user } = await makeUserOnDatabase()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })

    const { member } = await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/members/${member.id.toString()}/role`)
      .send({ role: InstitutionMemberRole.MANAGER })

    expect(response.status).toBe(401)
  })

  it('should not be able to update role without management permission', async () => {
    const { accessToken, user } = await authenticateUser()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })

    const { member } = await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/members/${member.id.toString()}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: InstitutionMemberRole.MANAGER })

    expect(response.status).toBe(403)
  })

  it('should not be able to demote the only active manager of the institution', async () => {
    const { accessToken, user } = await authenticateUser()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })

    const { member: manager } = await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.MANAGER,
    })

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/members/${manager.id.toString()}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: InstitutionMemberRole.STUDENT })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({ message: expect.any(String) })
  })

  it('should be able to demote a manager when there is another active manager', async () => {
    const { accessToken, user } = await authenticateUser()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })

    const { member: manager } = await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.MANAGER,
    })

    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      role: InstitutionMemberRole.MANAGER,
      status: InstitutionMemberStatus.ACTIVE,
    })

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/members/${manager.id.toString()}/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: InstitutionMemberRole.STUDENT })

    expect(response.status).toBe(200)
    expect(response.body.member.role).toBe(InstitutionMemberRole.STUDENT)
  })
})
