import { appForTest as app } from '@tests/app'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import { authenticateUser, setupManagerWithInstitution } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'

describe('(E2E) - GET /api/v1/institutions/:institutionId/members', () => {
  afterAll(async () => await app.close())

  it('should be able to fetch institution members as manager', async () => {
    const { accessToken, institution } = await setupManagerWithInstitution()
    const { user: extraUser } = await makeUserOnDatabase()
    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: extraUser.id.toString(),
    })

    const response = await request(app.server)
      .get(`/api/v1/institutions/${institution.id.toString()}/members`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.members.length).toBeGreaterThanOrEqual(2)
  })

  it('should not be able to fetch members when not allowed', async () => {
    const { accessToken, user } = await authenticateUser()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })
    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })

    const response = await request(app.server)
      .get(`/api/v1/institutions/${institution.id.toString()}/members`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
  })
})
