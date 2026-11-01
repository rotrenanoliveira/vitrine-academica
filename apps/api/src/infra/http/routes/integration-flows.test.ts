import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
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

describe('(E2E) - Fluxos entre recursos e headers', () => {
  afterAll(async () => await app.close())

  it('fluxo projeto e tag: com projeto publicado e tag associada, deve listar o projeto na tag', async () => {
    const { accessToken } = await authenticateUser()
    const authorization = `Bearer ${accessToken}`
    const unique = Date.now()

    const projectResponse = await request(app.server)
      .post('/api/v1/projects')
      .set('Authorization', authorization)
      .send({ title: `Projeto do fluxo ${unique}`, description: 'Projeto criado pelo fluxo entre recursos' })
    const projectId = projectResponse.body.project.id as string

    const publishResponse = await request(app.server)
      .post(`/api/v1/projects/${projectId}/publish-now`)
      .set('Authorization', authorization)

    const tagResponse = await request(app.server)
      .post('/api/v1/tags')
      .send({ name: `Tag do fluxo ${unique}` })
    const tagId = tagResponse.body.tag.id as string

    const associationResponse = await request(app.server)
      .post(`/api/v1/projects/${projectId}/tags`)
      .set('Authorization', authorization)
      .send({ tagId })

    const listResponse = await request(app.server).get(`/api/v1/tags/${tagId}/projects`)

    expect(projectResponse.status).toBe(201)
    expect(publishResponse.status).toBe(200)
    expect(tagResponse.status).toBe(201)
    expect(associationResponse.status).toBe(201)
    expect(listResponse.status).toBe(200)
    expect(listResponse.body.projects).toHaveLength(1)
    expect(listResponse.body.projects[0]).toMatchObject({
      id: projectId,
      title: `Projeto do fluxo ${unique}`,
      status: 'PUBLISHED',
    })
  })

  it('cors: com origem do front, deve retornar 200 com header de acesso permitido', async () => {
    const response = await request(app.server)
      .get('/api/v1/projects/scheduled/soon')
      .set('Origin', 'http://localhost:3000')

    expect(response.status).toBe(200)
    expect(response.headers['access-control-allow-origin']).toMatch(/^(\*|http:\/\/localhost:3000)$/)
    expect(response.headers['content-type']).toContain('application/json')
  })
})
