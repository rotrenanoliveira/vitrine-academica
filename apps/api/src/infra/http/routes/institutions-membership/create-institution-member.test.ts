import { appForTest as app } from '@tests/app'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import { authenticateUser, setupManagerWithInstitution } from '@tests/factories/setup-manager-institution'
import request from 'supertest'
import { InstitutionMemberRole } from '@/domain/institution/enterprise/entities/institution-member'

describe('(E2E) - POST /api/v1/institutions/:institutionId/members', () => {
  afterAll(async () => await app.close())

  it('should be able to create an institution member as manager', async () => {
    const { accessToken, institution } = await setupManagerWithInstitution()
    const { user: newMemberUser } = await makeUserOnDatabase()

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: newMemberUser.id.toString(),
        role: InstitutionMemberRole.STUDENT,
      })

    expect(response.status).toBe(201)
    expect(response.body.member.userId).toBe(newMemberUser.id.toString())
    expect(response.body.member.role).toBe('STUDENT')
  })

  it('should not be able to create a member when not allowed', async () => {
    const { accessToken, user } = await authenticateUser()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })
    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })
    const { user: newMemberUser } = await makeUserOnDatabase()

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: newMemberUser.id.toString(),
        role: InstitutionMemberRole.STUDENT,
      })

    expect(response.status).toBe(403)
  })

  it('should not be able to create a duplicate member', async () => {
    const { accessToken, institution } = await setupManagerWithInstitution()
    const { user: existingUser } = await makeUserOnDatabase()
    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: existingUser.id.toString(),
      role: InstitutionMemberRole.STUDENT,
    })

    const response = await request(app.server)
      .post(`/api/v1/institutions/${institution.id.toString()}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: existingUser.id.toString(),
        role: InstitutionMemberRole.STUDENT,
      })

    expect(response.status).toBe(409)
  })

  it('should not be able to create a member when institution does not exist', async () => {
    const { accessToken } = await authenticateUser()
    const { user: newMemberUser } = await makeUserOnDatabase()

    const response = await request(app.server)
      .post('/api/v1/institutions/00000000-0000-4000-8000-000000000000/members')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: newMemberUser.id.toString(),
        role: InstitutionMemberRole.STUDENT,
      })

    expect(response.status).toBe(404)
  })
})
