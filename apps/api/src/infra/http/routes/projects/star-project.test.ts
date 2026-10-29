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

describe('(E2E) - POST /api/v1/projects/:projectId/stars', () => {
  afterAll(async () => await app.close())

  it('should be able to add a star to a project', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
    })

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/stars`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      projectStar: {
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

  it('should not be able to star a project with an unauthenticated user', async () => {
    const { user: author } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
    })

    const response = await request(app.server).post(`/api/v1/projects/${project.id.toString()}/stars`)

    expect(response.status).toBe(401)
  })

  it('should not be able to star a own project', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
    })

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/stars`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to start an inexistent project', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post(`/api/v1/projects/${new UniqueEntityId().toString()}/stars`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
