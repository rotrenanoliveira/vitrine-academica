import { appForTest as app } from '@tests/app'
import { makePreferenceTagOnDatabase } from '@tests/factories/make-preference-tag'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectTagOnDatabase } from '@tests/factories/make-project-tag'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

describe('(E2E) - GET /api/v1/users/:userId/projects-of-interest', () => {
  afterAll(async () => await app.close())

  it('should be able to fetch projects of interest based on user preference tags', async () => {
    const { user } = await makeUserOnDatabase()
    const { tag: preferredTag } = await makeTagOnDatabase({ name: 'Astronomia' })
    const { tag: otherTag } = await makeTagOnDatabase({ name: 'Geografia' })

    const { project: interestingProject } = await makeProjectOnDatabase({ author: user.id })
    const { project: anotherInterestingProject } = await makeProjectOnDatabase({ author: user.id })
    const { project: unrelatedProject } = await makeProjectOnDatabase({ author: user.id })

    await makePreferenceTagOnDatabase({ userId: user.id, tagId: preferredTag.id })
    await makeProjectTagOnDatabase({ projectId: interestingProject.id, tagId: preferredTag.id })
    await makeProjectTagOnDatabase({
      projectId: anotherInterestingProject.id,
      tagId: preferredTag.id,
    })
    await makeProjectTagOnDatabase({ projectId: unrelatedProject.id, tagId: otherTag.id })

    const response = await request(app.server).get(
      `/api/v1/users/${user.id.toString()}/projects-of-interest`,
    )

    expect(response.status).toBe(200)
    expect(response.body.projects).toHaveLength(2)
    expect(response.body.projects.map((project: { id: string }) => project.id)).toEqual(
      expect.arrayContaining([
        interestingProject.id.toString(),
        anotherInterestingProject.id.toString(),
      ]),
    )
  })

  it('should not be able to fetch projects of interest when user does not exist', async () => {
    const response = await request(app.server).get(
      `/api/v1/users/${new UniqueEntityId().toString()}/projects-of-interest`,
    )

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
