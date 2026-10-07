import { appForTest as app } from '@tests/app'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import { authenticateUser, setupManagerWithInstitution } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'

describe('(E2E) - GET /api/v1/institutions/:institutionId/members/:memberId', () => {
  afterAll(async () => await app.close())

  it('should be able to get an institution member by id as manager', async () => {
    const { accessToken, institution } = await setupManagerWithInstitution()
    const { user: memberUser } = await makeUserOnDatabase()
    const { member } = await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: memberUser.id.toString(),
    })

    const response = await request(app.server)
      .get(`/api/v1/institutions/${institution.id.toString()}/members/${member.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.member.id).toBe(member.id.toString())
  })

  it('should not be able to get a member when not allowed', async () => {
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
      .get(`/api/v1/institutions/${institution.id.toString()}/members/${member.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
  })

  it('should not be able to get a member that does not exist', async () => {
    const { accessToken, institution } = await setupManagerWithInstitution()

    const response = await request(app.server)
      .get(`/api/v1/institutions/${institution.id.toString()}/members/00000000-0000-4000-8000-000000000000`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
  })
})
