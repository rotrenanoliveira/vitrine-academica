import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
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

describe('(E2E) - GET /api/v1/projects/:projectId/ratings', () => {
  afterAll(async () => await app.close())

  it('should be able to get project rating', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
    })

    await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/stars`)
      .set('Authorization', `Bearer ${accessToken}`)

    const response = await request(app.server).get(`/api/v1/projects/${project.id.toString()}/ratings`)

    expect(response.status).toBe(200)
    expect(response.body.rating.starsCount).toBe(1)
    expect(response.body.rating.starsWeightedScore).toBe(1)
    expect(response.body.rating).not.toHaveProperty('userId')
    expect(response.body.rating.teacherScoresByCriterion).toEqual([])
  })

  it('should not be able to return the rating of inexistent project', async () => {
    const response = await request(app.server).get(`/api/v1/projects/${new UniqueEntityId().toString()}/ratings`)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
