import { appForTest as app } from '@tests/app'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { authenticateUser } from '@tests/factories/setup-manager-institution'
import request from 'supertest'

describe('(E2E) - GET /api/v1/institutions/me', () => {
  afterAll(async () => await app.close())

  it('should be able to fetch my institution memberships when empty', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/institutions/me')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.members).toEqual([])
  })

  it('should be able to fetch my institution memberships', async () => {
    const { accessToken, user } = await authenticateUser()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })
    const { member } = await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
    })

    const response = await request(app.server)
      .get('/api/v1/institutions/me')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.members).toHaveLength(1)
    expect(response.body.members[0].id).toBe(member.id.toString())
  })

  it('should not be able to fetch my memberships without a token', async () => {
    const response = await request(app.server).get('/api/v1/institutions/me')

    expect(response.status).toBe(401)
  })
})
