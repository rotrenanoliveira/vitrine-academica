import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
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

describe('(E2E) - PUT /api/v1/projects/:projectId', () => {
  afterAll(async () => await app.close())

  it('deve atualizar um rascunho do autor', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.SKETCH,
    })

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Título atualizado',
        description: 'Descrição atualizada',
      })

    expect(response.status).toBe(200)
    expect(response.body.project.title).toBe('Título atualizado')
    expect(response.body.project.description).toBe('Descrição atualizada')
  })

  it('deve publicar o projeto alterando o status', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.SKETCH,
    })

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: project.title,
        description: project.description,
        status: 'PUBLISHED',
      })

    expect(response.status).toBe(200)
    expect(response.body.project.status).toBe('PUBLISHED')
  })

  it('deve atualizar projeto que não é rascunho', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.SCHEDULED,
    })

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Novo',
        description: 'Novo',
        status: 'PUBLISHED',
      })

    expect(response.status).toBe(200)
    expect(response.body.project.status).toBe('PUBLISHED')
  })

  it('não deve atualizar projeto de outro autor', async () => {
    const { accessToken } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: owner.id,
      status: ProjectStatus.SKETCH,
    })

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Hack',
        description: 'Hack',
      })

    expect(response.status).toBe(403)
  })
})
