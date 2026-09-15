import { appForTest as app } from '@tests/app'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

describe('(E2E) - POST /api/v1/projects/:projectId/tags', () => {
  afterAll(async () => await app.close())

  it('should be able to register a tag on a project', async () => {
    const { user } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: user.id })
    const { tag } = await makeTagOnDatabase()

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/tags`)
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
    const { tag } = await makeTagOnDatabase()

    const response = await request(app.server)
      .post(`/api/v1/projects/${new UniqueEntityId().toString()}/tags`)
      .send({
        tagId: tag.id.toString(),
      })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to register a tag when tag does not exist', async () => {
    const { user } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: user.id })

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/tags`)
      .send({
        tagId: new UniqueEntityId().toString(),
      })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('should not be able to register a tag already registered on the project', async () => {
    const { user } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: user.id })
    const { tag } = await makeTagOnDatabase()

    await request(app.server).post(`/api/v1/projects/${project.id.toString()}/tags`).send({
      tagId: tag.id.toString(),
    })

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/tags`)
      .send({
        tagId: tag.id.toString(),
      })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
