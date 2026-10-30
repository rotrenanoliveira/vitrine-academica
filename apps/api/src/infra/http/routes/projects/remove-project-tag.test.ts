import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectTagOnDatabase } from '@tests/factories/make-project-tag'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'

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

describe('(E2E) - DELETE /api/v1/projects/:projectId/tags/:tagId', () => {
  afterAll(async () => await app.close())

  it('should be able to remove a tag from a project', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id })
    const { tag } = await makeTagOnDatabase()
    await makeProjectTagOnDatabase({ projectId: project.id, tagId: tag.id })

    const response = await request(app.server)
      .delete(`/api/v1/projects/${project.id.toString()}/tags/${tag.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.project.id).toBe(project.id.toString())
  })

  it('should not be able to remove a tag without authentication', async () => {
    const { user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id })
    const { tag } = await makeTagOnDatabase()

    const response = await request(app.server).delete(
      `/api/v1/projects/${project.id.toString()}/tags/${tag.id.toString()}`,
    )

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to remove a tag from a project of another author', async () => {
    const { accessToken } = await authenticateUser()
    const { user: otherUser } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: otherUser.id })
    const { tag } = await makeTagOnDatabase()
    await makeProjectTagOnDatabase({ projectId: project.id, tagId: tag.id })

    const response = await request(app.server)
      .delete(`/api/v1/projects/${project.id.toString()}/tags/${tag.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to remove a tag that is not linked to the project', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id })
    const { tag } = await makeTagOnDatabase()

    const response = await request(app.server)
      .delete(`/api/v1/projects/${project.id.toString()}/tags/${tag.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
