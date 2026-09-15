import { appForTest as app } from '@tests/app'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import { authenticateUser, setupManagerWithInstitution } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import {
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'

describe('(E2E) - POST /api/v1/institutions/:institutionId/members/:memberId/status', () => {
  afterAll(async () => await app.close())

  it('should be able to update an institution member status as manager', async () => {
    const { accessToken, institution } = await setupManagerWithInstitution()
    const { user: memberUser } = await makeUserOnDatabase()
    const { member } = await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: memberUser.id.toString(),
    })

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/members/${member.id.toString()}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: InstitutionMemberStatus.INACTIVE })

    expect(response.status).toBe(200)
    expect(response.body.member.status).toBe('INACTIVE')
  })

  it('should not be able to update member status when not allowed', async () => {
    const { accessToken, user } = await authenticateUser()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })
    const { user: memberUser } = await makeUserOnDatabase()
    const { member } = await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: memberUser.id.toString(),
    })
    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/members/${member.id.toString()}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: InstitutionMemberStatus.INACTIVE })

    expect(response.status).toBe(403)
  })

  it('should not be able to update member status when member does not exist', async () => {
    const { accessToken, institution } = await setupManagerWithInstitution()

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/members/00000000-0000-4000-8000-000000000000/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: InstitutionMemberStatus.INACTIVE })

    expect(response.status).toBe(404)
  })
})
