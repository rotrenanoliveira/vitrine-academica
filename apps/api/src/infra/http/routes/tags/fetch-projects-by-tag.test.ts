import { appForTest as app } from '@tests/app'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectTagOnDatabase } from '@tests/factories/make-project-tag'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

describe('(E2E) - GET /api/v1/tags/:tagId/projects', () => {
  afterAll(async () => await app.close())

  it('should be able to fetch projects related to a tag', async () => {
    const { user } = await makeUserOnDatabase()
    const { tag } = await makeTagOnDatabase()
    const { project: firstProject } = await makeProjectOnDatabase({ author: user.id })
    const { project: secondProject } = await makeProjectOnDatabase({ author: user.id })
    await makeProjectOnDatabase({ author: user.id })

    await makeProjectTagOnDatabase({ projectId: firstProject.id, tagId: tag.id })
    await makeProjectTagOnDatabase({ projectId: secondProject.id, tagId: tag.id })

    const response = await request(app.server).get(`/api/v1/tags/${tag.id.toString()}/projects`)

    expect(response.status).toBe(200)
    expect(response.body.projects).toHaveLength(2)
    expect(response.body.projects.map((project: { id: string }) => project.id)).toEqual(
      expect.arrayContaining([firstProject.id.toString(), secondProject.id.toString()]),
    )
  })

  it('should not be able to fetch projects when tag does not exist', async () => {
    const response = await request(app.server).get(
      `/api/v1/tags/${new UniqueEntityId().toString()}/projects`,
    )

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
