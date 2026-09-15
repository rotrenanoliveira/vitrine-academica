import { appForTest as app } from '@tests/app'
import { makeAttachmentOnDatabase } from '@tests/factories/make-attachment'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeInstitutionMembershipRequestOnDatabase } from '@tests/factories/make-institution-membership-request'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import { authenticateUser } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { InstitutionMembershipRequestRole } from '@/domain/institution/enterprise/entities/institution-membership-request'

describe('(E2E) - POST /api/v1/institutions/:institutionId/membership-requests', () => {
  afterAll(async () => await app.close())

  it('should be able to request institution membership without proof', async () => {
    const { user: owner } = await makeUserOnDatabase()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: owner.id, shouldProof: false })
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/membership-requests`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: InstitutionMembershipRequestRole.STUDENT })

    expect(response.status).toBe(201)
    expect(response.body.request.status).toBe('PENDING')
    expect(response.body.request.proofAttachmentId).toBeNull()
  })

  it('should be able to request institution membership with proof', async () => {
    const { user: owner } = await makeUserOnDatabase()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: owner.id, shouldProof: true })
    const { attachment } = await makeAttachmentOnDatabase()
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/membership-requests`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        role: InstitutionMembershipRequestRole.STUDENT,
        proofAttachmentId: attachment.id.toString(),
      })

    expect(response.status).toBe(201)
    expect(response.body.request.proofAttachmentId).toBe(attachment.id.toString())
  })

  it('should not be able to request membership without proof when required', async () => {
    const { user: owner } = await makeUserOnDatabase()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: owner.id, shouldProof: true })
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/membership-requests`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: InstitutionMembershipRequestRole.STUDENT })

    expect(response.status).toBe(400)
  })

  it('should not be able to request membership when already a member', async () => {
    const { user: owner } = await makeUserOnDatabase()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: owner.id })
    const { accessToken, user } = await authenticateUser()
    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
    })

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/membership-requests`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: InstitutionMembershipRequestRole.STUDENT })

    expect(response.status).toBe(409)
  })

  it('should not be able to request membership when a pending request exists', async () => {
    const { user: owner } = await makeUserOnDatabase()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: owner.id })
    const { accessToken, user } = await authenticateUser()
    await makeInstitutionMembershipRequestOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
    })

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/membership-requests`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: InstitutionMembershipRequestRole.STUDENT })

    expect(response.status).toBe(409)
  })
})
