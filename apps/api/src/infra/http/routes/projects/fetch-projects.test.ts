import { appForTest as app } from '@tests/app'
import { authenticateAs } from '@tests/factories/authenticate-as'
import { makePreferenceTagOnDatabase } from '@tests/factories/make-preference-tag'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectTagOnDatabase } from '@tests/factories/make-project-tag'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UserRole } from '@/domain/identity/enterprise/entities/user'

describe('(E2E) - GET /api/v1/projects', () => {
  afterAll(async () => await app.close())

  it('should be able to fetch all projects without authentication', async () => {
    const { user } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: user.id, title: 'Projeto público' })

    const response = await request(app.server).get('/api/v1/projects')

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(1)
    expect(response.body.projects[0].id).toBe(project.id.toString())
  })

  it('should be able to fetch projects by tags when the user is authenticated', async () => {
    const { accessToken, user } = await authenticateAs(app, UserRole.USER)
    const { tag: preferredTag } = await makeTagOnDatabase({ name: 'Astronomia' })
    const { tag: otherTag } = await makeTagOnDatabase({ name: 'Geografia' })
    const { project: interestingProject } = await makeProjectOnDatabase({ author: user.id, title: 'Eclipse' })
    const { project: unrelatedProject } = await makeProjectOnDatabase({ author: user.id, title: 'Mapa' })

    await makePreferenceTagOnDatabase({ userId: user.id, tagId: preferredTag.id })
    await makeProjectTagOnDatabase({ projectId: interestingProject.id, tagId: preferredTag.id })
    await makeProjectTagOnDatabase({ projectId: unrelatedProject.id, tagId: otherTag.id })

    const response = await request(app.server)
      .get('/api/v1/projects')
      .query({ scope: 'user' })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(1)
    expect(response.body.projects[0].id).toBe(interestingProject.id.toString())
  })

  it('should be able to fetch all projects when scope is all, even if the user is authenticated', async () => {
    const { accessToken, user } = await authenticateAs(app, UserRole.USER)
    const { tag } = await makeTagOnDatabase({ name: 'Astronomia' })
    const { project: interestingProject } = await makeProjectOnDatabase({ author: user.id, title: 'Eclipse' })
    await makeProjectOnDatabase({ author: user.id, title: 'Mapa' })

    await makePreferenceTagOnDatabase({ userId: user.id, tagId: tag.id })
    await makeProjectTagOnDatabase({ projectId: interestingProject.id, tagId: tag.id })

    const response = await request(app.server)
      .get('/api/v1/projects')
      .query({ scope: 'all' })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(2)
  })
})
