import { appForTest as app } from '@tests/app'
import { makeInstitutionMembershipRequestOnDatabase } from '@tests/factories/make-institution-membership-request'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import { authenticateUser, setupManagerWithInstitution } from '@tests/factories/setup-manager-institution'
import request from 'supertest'

describe('(E2E) - POST /api/v1/institutions/:institutionId/membership-requests/:requestId/reject', () => {
  afterAll(async () => await app.close())

  it('should be able to reject a membership request as manager', async () => {
    const { accessToken, institution } = await setupManagerWithInstitution()
    const { user: requester } = await makeUserOnDatabase()
    const { request: membershipRequest } = await makeInstitutionMembershipRequestOnDatabase({
      institutionId: institution.id.toString(),
      userId: requester.id.toString(),
    })

    const response = await request(app.server)
      .post(
        `/api/v1/institutions/${institution.id.toString()}/membership-requests/${membershipRequest.id.toString()}/reject`,
      )
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.request.status).toBe('REJECTED')
  })

  it('should not be able to reject when not allowed', async () => {
    const { institution } = await setupManagerWithInstitution()
    const { accessToken } = await authenticateUser()
    const { user: requester } = await makeUserOnDatabase()
    const { request: membershipRequest } = await makeInstitutionMembershipRequestOnDatabase({
      institutionId: institution.id.toString(),
      userId: requester.id.toString(),
    })

    const response = await request(app.server)
      .post(
        `/api/v1/institutions/${institution.id.toString()}/membership-requests/${membershipRequest.id.toString()}/reject`,
      )
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
  })
})
