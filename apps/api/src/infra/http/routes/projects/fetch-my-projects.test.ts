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

describe('(E2E) - GET /api/v1/projects/me', () => {
  afterAll(async () => await app.close())

  it('deve listar apenas os projetos do usuário autenticado', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: other } = await makeUserOnDatabase()

    await makeProjectOnDatabase({ author: user.id, title: 'Meu projeto' })
    await makeProjectOnDatabase({ author: other.id, title: 'Outro projeto' })

    const response = await request(app.server)
      .get('/api/v1/projects/me')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.projects).toHaveLength(1)
    expect(response.body.projects[0].title).toBe('Meu projeto')
  })

  it('deve filtrar por status', async () => {
    const { accessToken, user } = await authenticateUser()

    await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })
    await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.PUBLISHED })

    const response = await request(app.server)
      .get('/api/v1/projects/me')
      .query({ status: 'SKETCH' })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.projects).toHaveLength(1)
    expect(response.body.projects[0].status).toBe('SKETCH')
  })
})
