import { appForTest as app } from '@tests/app'
import { makeInstitutionMembershipRequestOnDatabase } from '@tests/factories/make-institution-membership-request'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import { authenticateUser, setupManagerWithInstitution } from '@tests/factories/setup-manager-institution'
import request from 'supertest'

describe('(E2E) - POST /api/v1/institutions/:institutionId/membership-requests/:requestId/approve', () => {
  afterAll(async () => await app.close())

  it('should be able to approve a membership request as manager', async () => {
    const { accessToken, institution } = await setupManagerWithInstitution()
    const { user: requester } = await makeUserOnDatabase()
    const { request: membershipRequest } = await makeInstitutionMembershipRequestOnDatabase({
      institutionId: institution.id.toString(),
      userId: requester.id.toString(),
    })

    const response = await request(app.server)
      .post(
        `/api/v1/institutions/${institution.id.toString()}/membership-requests/${membershipRequest.id.toString()}/approve`,
      )
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.request.status).toBe('APPROVED')
    expect(response.body.member.userId).toBe(requester.id.toString())
    expect(response.body.member.status).toBe('ACTIVE')
  })

  it('should not be able to approve when not allowed', async () => {
    const { institution } = await setupManagerWithInstitution()
    const { accessToken } = await authenticateUser()
    const { user: requester } = await makeUserOnDatabase()
    const { request: membershipRequest } = await makeInstitutionMembershipRequestOnDatabase({
      institutionId: institution.id.toString(),
      userId: requester.id.toString(),
    })

    const response = await request(app.server)
      .post(
        `/api/v1/institutions/${institution.id.toString()}/membership-requests/${membershipRequest.id.toString()}/approve`,
      )
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
  })

  it('should not be able to approve when request does not exist', async () => {
    const { accessToken, institution } = await setupManagerWithInstitution()

    const response = await request(app.server)
      .post(
        `/api/v1/institutions/${institution.id.toString()}/membership-requests/00000000-0000-4000-8000-000000000000/approve`,
      )
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
  })
})
