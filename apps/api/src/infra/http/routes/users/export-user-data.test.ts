import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectStarOnDatabase } from '@tests/factories/make-project-star'
import { makePromotionOnDatabase } from '@tests/factories/make-promotion'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

async function authenticateUser() {
  const { user } = await makeUserOnDatabase()
  const { account } = await makeAccountOnDatabase({ userId: user.id })
  const { plainCode } = await makeAccessCodeOnDatabase({ accountId: account.id })

  const loginResponse = await request(app.server).post('/api/v1/auth/sessions').send({
    email: user.email,
    code: plainCode,
  })

  return {
    accessToken: loginResponse.body.accessToken as string,
    user,
  }
}

describe('(E2E) - GET /api/v1/users/me/export', () => {
  afterAll(async () => await app.close())

  it('should be able to export authenticated user data', async () => {
    const { accessToken, user } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/users/me/export')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)

    expect(response.body).toEqual({
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        status: expect.any(String),
      },
      account: {
        id: expect.any(String),
        avatarId: null,
        createdAt: expect.any(String),
        confirmationAt: expect.any(String),
        consentedAt: null,
        updatedAt: expect.any(String),
      },
      sessions: expect.any(Array),
      institutions: expect.any(Array),
      preferences: expect.any(Array),
      projects: expect.any(Array),
      points: {
        balance: 0,
        transactions: [],
      },
      projectStars: [],
      promotions: [],
    })
  })

  it('should export the stars and the promotions given by the user', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: author.id, status: ProjectStatus.PUBLISHED })

    const { projectStar } = await makeProjectStarOnDatabase({ projectId: project.id, userId: user.id, weight: 5 })
    const { promotion } = await makePromotionOnDatabase({ projectId: project.id, promoterId: user.id })

    const response = await request(app.server)
      .get('/api/v1/users/me/export')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.projectStars).toEqual([
      {
        id: projectStar.id.toString(),
        projectId: project.id.toString(),
        weight: 5,
        active: expect.any(Boolean),
        ratedAt: expect.any(String),
        createdAt: expect.any(String),
      },
    ])
    expect(response.body.promotions).toEqual([
      {
        id: promotion.id.toString(),
        projectId: project.id.toString(),
        cost: promotion.cost,
        status: 'ACTIVE',
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
      },
    ])
  })

  it('should not be able to export user data without authentication', async () => {
    const response = await request(app.server).get('/api/v1/users/me/export')

    expect(response.status).toBe(401)

    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
