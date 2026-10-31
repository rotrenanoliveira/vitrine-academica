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

describe('(E2E) - GET /api/v1/me/starred-projects', () => {
  afterAll(async () => await app.close())

  it('should be able to list all project starred of the user', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
    })
    const { project: otherProject } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
    })

    await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/stars`)
      .set('Authorization', `Bearer ${accessToken}`)

    const otherUser = await authenticateUser()
    await request(app.server)
      .post(`/api/v1/projects/${otherProject.id.toString()}/stars`)
      .set('Authorization', `Bearer ${otherUser.accessToken}`)

    const response = await request(app.server)
      .get('/api/v1/me/starred-projects')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0]).toEqual({
      project: {
        id: project.id.toString(),
        title: project.title,
        description: project.description,
        authorId: author.id.toString(),
        status: 'PUBLISHED',
        attachments: [],
        tags: [],
        createdAt: expect.any(String),
      },
      star: {
        id: expect.any(String),
        projectId: project.id.toString(),
        userId: user.id.toString(),
        weight: 1,
        active: true,
        ratedAt: expect.any(String),
        createdAt: expect.any(String),
      },
    })
  })
})
