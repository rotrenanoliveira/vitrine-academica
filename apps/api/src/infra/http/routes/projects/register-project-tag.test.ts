import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

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

describe('(E2E) - POST /api/v1/projects/:projectId/tags', () => {
  afterAll(async () => await app.close())

  it('should be able to register a tag on a project', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id })
    const { tag } = await makeTagOnDatabase()

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/tags`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tagId: tag.id.toString(),
      })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      projectTag: {
        id: expect.any(String),
        projectId: project.id.toString(),
        tagId: tag.id.toString(),
      },
    })
  })

  it('should not be able to register a tag when project does not exist', async () => {
    const { accessToken } = await authenticateUser()
    const { tag } = await makeTagOnDatabase()

    const response = await request(app.server)
      .post(`/api/v1/projects/${new UniqueEntityId().toString()}/tags`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tagId: tag.id.toString(),
      })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to register a tag when tag does not exist', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id })

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/tags`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tagId: new UniqueEntityId().toString(),
      })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to register a tag already registered on the project', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id })
    const { tag } = await makeTagOnDatabase()

    await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/tags`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tagId: tag.id.toString(),
      })

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/tags`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tagId: tag.id.toString(),
      })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
