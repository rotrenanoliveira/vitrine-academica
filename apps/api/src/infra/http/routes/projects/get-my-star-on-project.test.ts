import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
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

describe('(E2E) - GET /api/v1/projects/:projectId/stars/me', () => {
  afterAll(async () => await app.close())

  it('should be able to return the star active of user in the project', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
    })

    await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/stars`)
      .set('Authorization', `Bearer ${accessToken}`)

    const response = await request(app.server)
      .get(`/api/v1/projects/${project.id.toString()}/stars/me`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.star).toEqual({
      projectId: project.id.toString(),
      userId: user.id.toString(),
    })
  })

  it('should return null if user has not star the project', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
    })

    const response = await request(app.server)
      .get(`/api/v1/projects/${project.id.toString()}/stars/me`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ star: null })
  })
})
