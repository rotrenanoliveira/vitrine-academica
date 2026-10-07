import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProject } from '@tests/factories/make-project'
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

describe('(E2E) - POST /api/v1/projects', () => {
  afterAll(async () => await app.close())

  it('deve ser possivel registrar um projeto autenticado', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = makeProject({ author: user.id })

    const response = await request(app.server)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: project.title,
        description: project.description,
      })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      project: {
        id: expect.any(String),
        title: project.title,
        description: project.description,
        authorId: user.id.toString(),
        status: 'SKETCH',
        attachments: [],
        tags: [],
        createdAt: expect.any(String),
      },
    })
  })

  it('não deve registrar projeto sem autenticação', async () => {
    const response = await request(app.server).post('/api/v1/projects').send({
      title: 'Título',
      description: 'Descrição',
    })

    expect(response.status).toBe(401)
  })
})
