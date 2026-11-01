import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectScheduledOnDatabase } from '@tests/factories/make-project-scheduled'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
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

describe('(E2E) - POST /api/v1/projects/:projectId/schedule', () => {
  afterAll(async () => await app.close())

  it('agendar: com projeto em rascunho, deve retornar 201 com o agendamento', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id })
    const publishedIn = new Date('2030-01-15T12:00:00.000Z')

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/schedule`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        publishedIn: publishedIn.toISOString(),
      })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      projectScheduled: {
        id: expect.any(String),
        projectId: project.id.toString(),
        publishedIn: publishedIn.toISOString(),
        createdAt: expect.any(String),
      },
    })
  })

  it('agendar: com projeto inexistente, deve retornar 404 com mensagem', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post(`/api/v1/projects/${new UniqueEntityId().toString()}/schedule`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        publishedIn: new Date('2030-01-15T12:00:00.000Z').toISOString(),
      })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('agendar: com projeto de outro usuário, deve retornar 403', async () => {
    const { accessToken } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: owner.id })

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/schedule`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        publishedIn: new Date('2030-01-15T12:00:00.000Z').toISOString(),
      })

    expect(response.status).toBe(403)
  })

  it('agendar: com projeto já agendado, deve retornar 409 com mensagem', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id })

    await makeProjectScheduledOnDatabase({
      projectId: project.id,
      publishedIn: new Date('2030-01-15T12:00:00.000Z'),
    })

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/schedule`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        publishedIn: new Date('2030-02-20T12:00:00.000Z').toISOString(),
      })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })

  it('agendar: com projeto fora de rascunho, deve retornar 400 com mensagem', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
    })

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/schedule`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        publishedIn: new Date('2030-01-15T12:00:00.000Z').toISOString(),
      })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      message: expect.any(String),
    })
  })
})
