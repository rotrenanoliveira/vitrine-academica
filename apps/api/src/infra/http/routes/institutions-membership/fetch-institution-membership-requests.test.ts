import { appForTest as app } from '@tests/app'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeInstitutionMembershipRequestOnDatabase } from '@tests/factories/make-institution-membership-request'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import { authenticateUser, setupManagerWithInstitution } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'

describe('(E2E) - GET /api/v1/institutions/:institutionId/membership-requests', () => {
  afterAll(async () => await app.close())

  it('should be able to fetch membership requests as manager', async () => {
    const { accessToken, institution } = await setupManagerWithInstitution()
    const { user: requester } = await makeUserOnDatabase()
    await makeInstitutionMembershipRequestOnDatabase({
      institutionId: institution.id.toString(),
      userId: requester.id.toString(),
    })

    const response = await request(app.server)
      .get(`/api/v1/institutions/${institution.id.toString()}/membership-requests`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.requests.length).toBeGreaterThanOrEqual(1)
  })

  it('should not be able to fetch membership requests when not allowed', async () => {
    const { accessToken, user } = await authenticateUser()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })
    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })

    const response = await request(app.server)
      .get(`/api/v1/institutions/${institution.id.toString()}/membership-requests`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
  })
})
