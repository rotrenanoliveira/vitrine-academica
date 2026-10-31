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

describe('(E2E) - DELETE /api/v1/projects/:projectId/stars', () => {
  afterAll(async () => await app.close())

  it('shoudl be able to unstar a project', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
    })

    await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/stars`)
      .set('Authorization', `Bearer ${accessToken}`)

    const response = await request(app.server)
      .delete(`/api/v1/projects/${project.id.toString()}/stars`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(204)
  })

  it('should not be able to unstar a project with unauthenticated user', async () => {
    const { user: author } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
    })

    const response = await request(app.server).delete(`/api/v1/projects/${project.id.toString()}/stars`)

    expect(response.status).toBe(401)
  })

  it('should not be able to unstar a project for an inexistent project', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .delete(`/api/v1/projects/${new UniqueEntityId().toString()}/stars`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
