import { appForTest as app } from '@tests/app'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { authenticateUser, setupManagerWithInstitution } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'
import { InstitutionStatus } from '@/domain/institution/enterprise/entities/institutions'

describe('(E2E) - POST /api/v1/institutions/:institutionId/status', () => {
  afterAll(async () => await app.close())

  it('should be able to update an institution status as manager', async () => {
    const { accessToken, institution } = await setupManagerWithInstitution()

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: InstitutionStatus.INACTIVE })

    expect(response.status).toBe(200)
    expect(response.body.institution.status).toBe('INACTIVE')
  })

  it('should not be able to update an institution status when not allowed', async () => {
    const { accessToken, user } = await authenticateUser()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })
    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: InstitutionStatus.INACTIVE })

    expect(response.status).toBe(403)
  })

  it('should not be able to update status when institution does not exist', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post('/api/v1/institutions/00000000-0000-4000-8000-000000000000/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: InstitutionStatus.INACTIVE })

    expect(response.status).toBe(404)
  })
})
