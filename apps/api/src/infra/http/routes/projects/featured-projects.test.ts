import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makePreferenceTagOnDatabase } from '@tests/factories/make-preference-tag'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectTagOnDatabase } from '@tests/factories/make-project-tag'
import { makePromotionOnDatabase } from '@tests/factories/make-promotion'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Slug } from '@/core/entities/value-objects/slug'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { PreferenceTagStatus } from '@/domain/tag/enterprise/entities/preference-tag'

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

async function makePublishedProject() {
  const { user: author } = await makeUserOnDatabase()
  const { project } = await makeProjectOnDatabase({ author: author.id, status: ProjectStatus.PUBLISHED })

  return { project }
}

async function promoteOnDatabase(projectId: UniqueEntityId, expiresAt?: Date) {
  const { user: promoter } = await makeUserOnDatabase()

  await makePromotionOnDatabase({ projectId, promoterId: promoter.id, ...(expiresAt ? { expiresAt } : {}) })
}

describe('(E2E) - featured flag on project responses', () => {
  afterAll(async () => await app.close())

  it('should return featured true on the project page when the project has an active promotion', async () => {
    const { accessToken } = await authenticateUser()
    const { project } = await makePublishedProject()
    await promoteOnDatabase(project.id)

    const response = await request(app.server)
      .get(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.project.featured).toBe(true)
  })

  it('should return featured false on the project page when the project is not promoted', async () => {
    const { accessToken } = await authenticateUser()
    const { project } = await makePublishedProject()

    const response = await request(app.server)
      .get(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.project.featured).toBe(false)
  })

  it('should return featured false when the promotion validity has passed', async () => {
    const { accessToken } = await authenticateUser()
    const { project } = await makePublishedProject()
    await promoteOnDatabase(project.id, new Date(Date.now() - 1000))

    const response = await request(app.server)
      .get(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.project.featured).toBe(false)
  })

  it('should flag only the promoted projects in the published projects list', async () => {
    const { project: promoted } = await makePublishedProject()
    const { project: regular } = await makePublishedProject()
    await promoteOnDatabase(promoted.id)

    const response = await request(app.server).get('/api/v1/projects/published')

    expect(response.status).toBe(200)

    const promotedItem = response.body.projects.find((item: { id: string }) => item.id === promoted.id.toString())
    const regularItem = response.body.projects.find((item: { id: string }) => item.id === regular.id.toString())

    expect(promotedItem.featured).toBe(true)
    expect(regularItem.featured).toBe(false)
  })

  it('should flag only the promoted projects in the projects of interest of the user', async () => {
    const { user } = await makeUserOnDatabase()
    const tagName = `Tag ${new UniqueEntityId().toString()}`
    const { tag } = await makeTagOnDatabase({ name: tagName, slug: Slug.createFromText(tagName) })

    await makePreferenceTagOnDatabase({ userId: user.id, tagId: tag.id, status: PreferenceTagStatus.ACTIVE })

    const { project: promoted } = await makePublishedProject()
    const { project: regular } = await makePublishedProject()

    await makeProjectTagOnDatabase({ projectId: promoted.id, tagId: tag.id })
    await makeProjectTagOnDatabase({ projectId: regular.id, tagId: tag.id })
    await promoteOnDatabase(promoted.id)

    const response = await request(app.server).get(`/api/v1/users/${user.id.toString()}/projects-of-interest`)

    expect(response.status).toBe(200)

    const promotedItem = response.body.projects.find((item: { id: string }) => item.id === promoted.id.toString())
    const regularItem = response.body.projects.find((item: { id: string }) => item.id === regular.id.toString())

    expect(promotedItem.featured).toBe(true)
    expect(regularItem.featured).toBe(false)
  })
})
