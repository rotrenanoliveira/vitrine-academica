import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import { InstitutionOrigin } from '@/domain/institution/enterprise/entities/institutions'

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

describe('(E2E) - DELETE /api/v1/users/me', () => {
  afterAll(async () => await app.close())

  it('should be able to delete (anonymize) the authenticated user account', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server).delete('/api/v1/users/me').set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      archivedInstitutions: [],
    })
  })

  it('should not be able to delete the account without authentication', async () => {
    const response = await request(app.server).delete('/api/v1/users/me')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to delete the account when user is the only manager and there are other members', async () => {
    const { accessToken, user } = await authenticateUser()

    const { institution } = await makeInstitutionOnDatabase({
      origin: InstitutionOrigin.USER_REGISTRATION,
      registerBy: user.id,
    })

    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.MANAGER,
    })

    const { user: anotherUser } = await makeUserOnDatabase()

    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: anotherUser.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })

    const response = await request(app.server).delete('/api/v1/users/me').set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      message: expect.any(String),
      institutions: [{ id: institution.id.toString(), name: institution.name }],
    })
  })

  it('should archive the institution when the user is the only member', async () => {
    const { accessToken, user } = await authenticateUser()

    const { institution } = await makeInstitutionOnDatabase({
      origin: InstitutionOrigin.USER_REGISTRATION,
      registerBy: user.id,
    })

    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.MANAGER,
    })

    const response = await request(app.server).delete('/api/v1/users/me').set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      archivedInstitutions: [{ id: institution.id.toString(), name: institution.name }],
    })
  })

  it('should not be able to delete an account that was already deleted', async () => {
    const { accessToken } = await authenticateUser()

    await request(app.server).delete('/api/v1/users/me').set('Authorization', `Bearer ${accessToken}`)

    const response = await request(app.server).delete('/api/v1/users/me').set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(401)
  })
})
